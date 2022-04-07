<script setup>

import { reactive, ref } from 'vue';
import Papa from 'papaparse';
import Multiselect from '@vueform/multiselect';


const skyfallUrl = 'https://api.scryfall.com/cards/collection';
const upload = reactive({
  name: null, file: null, text: null, append: true, encoding: null, format: null, active: false, progress: 0, count: 0, total: 0
});
// let upload = reactive({ name: null, file: null, text: null, encoding: null, format: null, active: true, progress: 50, count: 50, total: 100 })

const props = defineProps({ db: Object, collections: Array, setIds: Set });
const emit = defineEmits(['change', 'close']);

const post = async (url = '', data = {}) => {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return response.json();
};

const checkEncoding = async (file) => {
  let arrayBuffer = await file.arrayBuffer();
  let array8 = new Uint8Array(arrayBuffer.slice(0, 10));
  // array8.forEach((x) => {
  // console.log(x.toString(16))
  // })
  if (array8[0].toString(16) == 'ff' && array8[1].toString(16) == 'fe') {
    return 'UTF-16LE';
  }
  else if (array8[0].toString(16) == 'fe' && array8[1].toString(16) == 'ff') {
    return 'UTF-16BE';
  }
  else if (array8[1] == 0 && array8[3] == 0 && array8[5] == 0) {
    return 'UTF-16LE';
  }
  return 'UTF-8';
};

const handleTextUpload = async (e) => {
  upload.active = true;
  upload.progress = 0;
  let cards = {};
  if (upload.format === 'MTGA') {
    const re = /([0-9]+) (.+) \((.+)\) ([0-9]+)/g;
    const matches = upload.text.matchAll(re);
    for (const m of matches) {
      cards[m[3] + m[4]] = {
        name: m[2].split(' // ')[0].trim(),
        count: parseInt(m[1]),
        set: m[3],
        number: m[4],
        foil: false,
      };
    };
  }
  else if (upload.format === 'MTGO') {
    const re = /([0-9]+) (.+)/g;
    const matches = upload.text.matchAll(re);
    for (const m of matches) {
      cards[m[2]] = {
        name: m[2].split(' // ')[0].trim(),
        count: parseInt(m[1]) || 1,
        set: '',
        number: '',
        foil: false,
      };
    }
  }
  else if (upload.format === 'MKM Email') {
    const re = /([0-9]+)x ([a-zA-Z ]+)/g;
    const matches = upload.text.matchAll(re);
    for (const m of matches) {
      // if(m[2].includes('Token')) {

      // }
      cards[m[2]] = {
        name: m[2].replace(" Token", "").trim(),
        count: parseInt(m[1]) || 1,
        set: '',
        number: '',
        foil: false,
      };
    }
  }
  updateCollection(upload.name, cards);
};

const handleFileUpload = async (e) => {
  if (fileElem.value.files.length === 0) {
    return;
  }
  let file = fileElem.value.files[0];
  const reader = new FileReader();
  upload.active = true;
  upload.progress = 0;

  let parser = null;
  if (upload.format === 'DragonShield Web') {
    parser = parseDSWeb;
  }

  reader.onload = async () => {
    let cardList = await parser(reader.result);
    updateCollection(upload.name, cardList);
  };
  let encoding = await checkEncoding(file);
  reader.readAsText(file, encoding);
};

const fileElem = ref(null);

Papa.parsePromise = (file) => {
  return new Promise((complete, error) => {
    Papa.parse(file, {
      header: true,
      worker: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: complete,
      error: error,
    });
  });
};

const parseDSWeb = async (csv) => {
  csv = csv.replace('"sep=,"', '');
  let parsed = await Papa.parsePromise(csv);
  let cards = {};
  parsed.data.forEach(row => {
    const setName = row['Set Name'];
    let setCode = row['Set Code'].toLowerCase();

    // Find set id for mismatched set ids
    if (!props.setIds.has(setCode)) {
      console.log(`Couldn't find set for ${row['Card Name']} ${row['Card Number']} ${setName} [${setCode}]`);
      cards[setCode + row['Card Number']] = {
        name: row['Card Name'],
        count: parseInt(row['Quantity']),
        set: '',
        number: '',
        foil: row['Printing'] === 'Foil'
      };
    }
    else {
      cards[setCode + row['Card Number']] = {
        name: row['Card Name'],
        count: parseInt(row['Quantity']),
        set: setCode,
        number: row['Card Number'].toString(),
        foil: row['Printing'] === 'Foil'
      };

    }
  });
  return cards;
};

const fetchCardData = async (cardList) => {
  const ids = [];
  const counts = {};
  const foils = new Set();
  try {
    let cardData = [];

    for (const [key, _card] of Object.entries(cardList)) {
      let elem = {};
      if (_card.set === '' && _card.number === '') {
        elem.name = _card.name;
        counts[_card.name] = _card.count;
      }
      else {
        elem.set = _card.set;
        elem.collector_number = _card.number;
        counts[_card.set + _card.number] = _card.count;
        if(_card.foil) foils.add(_card.set + _card.number);
      }
      ids.push(elem);
    };

    upload.total = ids.length;
    for (let i = 0; i < ids.length; i += 75) {
      const resp = await post(skyfallUrl, { identifiers: ids.slice(i, i + 75) });
      if (resp.not_found.length > 0) {
        console.log(resp.not_found);
      }
      let data = resp.data.map(c => {
        c.count = counts[c.name] || (counts[c.set + c.collector_number] || 1);
        c.is_foil = foils.has(c.set + c.collector_number);
        return c;
      });
      cardData = cardData.concat(data);
      upload.count = i;
      upload.progress = (i / ids.length) * 100;
      await new Promise((r) => setTimeout(r, 100));
    }
    upload.progress = 100;
    return cardData;
  }
  catch (e) {
    console.error(e);
  }
  finally {
    upload.active = false;
    upload.count = 0;
    upload.progress = 0;
    upload.total = 0;
    emit('close');
  }
};

const updateCollection = async (name, cardList, append = null) => {
  let cardData = [];
  if(!append) {
    append = upload.append;
  }
  // If collection exists and append, only add new cards, sum counts
  if (append && props.collections.includes(name)) {
    const collection = await props.db.collections.get({ name: name });
    cardData = collection.cards;
    for (const [key, card] of Object.entries(cardList)) {
      let existing = collection.cards.filter(c => {
        if(c === undefined) {
          return false;
        }
        if (card.set !== '' && card.set === c.set && card.number === c.collector_number) return true;
        return c.name === card.name;
      });
      if (existing.length > 0) {
        existing[0].count = card.count;
        delete cardList[key];
      }
    }
  }
  if (cardList) {
    const newData = await fetchCardData(cardList);
    cardData = cardData.concat(newData);
  }
  emit('change', name, cardData);
};
</script>

<template>
  <div class="upload">
    <button
      class="small close"
      @click="emit('close')"
    >
      <span>+</span>
    </button>
    <div class="form">
      <h3>Name</h3>
      <input
        type="text"
        v-model="upload.name"
      >
      <h3>Format</h3>
      <Multiselect
        v-model="upload.format"
        :options="['DragonShield Web', 'DragonShield Mobile', 'MKM Email', 'MTGA', 'MTGO']"
        :can-clear="false"
      />

      <div>
        <label for="append">Append?</label>
        <input id="append" type="checkbox" v-model="upload.append">
      </div>

      <template v-if="['MTGA', 'MTGO', 'MKM Email'].includes(upload.format)">
        <textarea v-model="upload.text" />
      </template>

      <label
        class="button"
        for="file-input"
        v-if="['DragonShield Web', 'DragonShield Mobile'].includes(upload.format)"
      >Choose file</label>
      <input
        v-if="upload.format === 'DragonShield Web'"
        id="file-input"
        ref="fileElem"
        type="file"
        :disabled="upload.active"
      >
      <div
        class="buttons"
        v-if="!upload.active && upload.format && (upload.text || fileElem)"
      >
        <button
          @click="['MTGA', 'MTGO', 'MKM Email'].includes(upload.format) ? handleTextUpload() : handleFileUpload()"
        >
          Upload
        </button>
      </div>

      <div
        class="progress"
        v-if="upload.active"
      >
        <span>Processing cards: {{ upload.count }} / {{ upload.total }}</span>
        <div
          class="bar"
          :style="{ width: upload.progress + '%' }"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.progress {
  grid-column: span 2;
  position: relative;
  display: block;
  border-radius: var(--default-br);
  background-color: var(--colour-input-grey);
  height: var(--height-input);
  line-height: var(--height-input);
  text-align: center;
  font-family: "Beleren SmallCaps Bold";
  overflow: hidden;
}

.progress .bar {
  position: absolute;
  bottom: 0;
  height: 3px;
  background-color: var(--colour-accent);
  transition: all 0.3s;
}
.upload {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  max-width: 640px;
  margin: auto;
  gap: 20px;
}
.upload .close {
  position: absolute;
  top: 0;
  right: 0;
}
.upload .close span {
  display: block;
  transform: rotate(45deg);
}
.upload .form {
  display: grid;
  grid-template-columns: 1fr 10fr;
  gap: 20px;
  width: 100%;
  align-items: center;
}
/* .upload input[type="file"] {
  display: none;
} */
.upload .file {
  grid-column: span 2;
  display: block;
  width: 100%;
  background-color: var(--colour-input-grey);
  height: 200px;
}
.upload textarea {
  grid-column: 2;
  width: 100%;
  height: 300px;
}
.upload .buttons {
  grid-column: span 2;
  text-align: center;
}
.upload input[type="file"] {
  display: none;
}
.upload label {
  grid-column: 2;
}
</style>