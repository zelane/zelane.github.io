<script setup>

import { reactive, ref } from 'vue';
import Papa from 'papaparse';
import Multiselect from '@vueform/multiselect';
import { useToast } from "vue-toastification";


const toast = useToast();
// const skyfallUrl = 'https://api.scryfall.com/cards/collection';
const skyfallUrl = 'https://mtg-couchdb.1drmrcrnnfo1c.eu-west-2.cs.amazonlightsail.com';
// const skyfallUrl = 'http://localhost:3001';
const upload = reactive({
  name: null, 
  file: null, 
  text: "1 Golgari Signet\n1 Hornet Nest ", 
  append: true, 
  encoding: null, 
  format: "MTGO", 
  active: false, 
  progress: 0, 
  count: 0, 
  total: 0
});
const ui = reactive({
  name: null,
  upload: false,
});

const props = defineProps({ db: Object, collections: Array, setIds: Set });
const emit = defineEmits(['change', 'delete', 'close']);

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
  if (upload.format === 'Sync Code') {
    const code = upload.text.trim();
    await downloadCollection(upload.name, code);
    return;
  }
  else if (upload.format === 'MTGA') {
    const re = /([0-9]+) (.+) \((.+)\) ([0-9]+)/g;
    const matches = upload.text.matchAll(re);
    for (const m of matches) {
      cards[m[3] + m[4]] = {
        name: m[2].split(' // ')[0].trim(),
        count: parseInt(m[1]),
        set: m[3],
        number: m[4],
        finish: 'nonfoil',
        tags: [],
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
        finish: 'nonfoil',
        tags: [],
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
        finish: 'nonfoil',
        tags: [],
      };
    }
  }
  updateCollection(upload.name, new Map(Object.entries(cards)));
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
  let cards = new Map();
  let setSwaps = {
    'rmh1' :'h1r'
  };
  parsed.data.forEach(row => {
    const setName = row['Set Name'];
    let setCode = row['Set Code'].toLowerCase();
    if(setSwaps[setCode]) {
      setCode = setSwaps[setCode];
    }
    let finish = 'nonfoil';
    if(row['Printing'] === 'Foil') {
      finish = 'foil';
    }
    else if(row['Card Number'].toString().includes('etc')) {
      finish = 'etched';
    }
    const count = parseInt(row['Quantity']);

    let card = {
      name: row['Card Name'],
      count: count,
      set: '',
      number: '',
      finish: finish, 
      tags: [row['Folder Name']],
    };

    // Find set id for mismatched set ids
    let key = null;
    if (!props.setIds.has(setCode)) {
      console.log(`Couldn't find set for ${row['Card Name']} ${row['Card Number']} ${setName} [${setCode}]`);
      key = card.name + card.finish;
    }
    else {
      card.set = setCode,
      card.number = row['Card Number'].toString().replace("etc", "");
      key = setCode + row['Card Number'] + card.finish;
    }
    if(cards.has(key)) {
      let ex = cards.get(key);
      ex.count += count;
      ex.tags.push(row['Folder Name']);
      cards.set(key, ex);
    }
    else {
      cards.set(key, card);
    }
  });
  return cards;
};

const fetchCardData = async (cardList) => {
  const ids = [];
  const mapName = new Map();
  const mapSet = new Map();
  let cardData = [];

  try {
    for (const [key, _card] of cardList.entries()) {
      let elem = {};
      if (_card.set === '' && _card.number === '') {
        elem.name = _card.name;
      }
      else {
        elem.set = _card.set;
        elem.collector_number = _card.number;
      }
      ids.push(elem);
    };
    const chunk = 1000;
    upload.total = ids.length;
    for (let i = 0; i < ids.length; i += chunk) {
      const resp = await post(skyfallUrl + '/cards', { identifiers: ids.slice(i, i + chunk) });
      if (resp.not_found.length > 0) {
        console.log(resp.not_found);
      }
      resp.data.forEach(c => {
        mapName.set(c.name, c);
        mapSet.set(c.set + c.collector_number, c);
      });
      upload.count = i;
      upload.progress = (i / ids.length) * 100;
      // await new Promise((r) => setTimeout(r, 100));
    }

    for (const [key, _card] of cardList.entries()) {
      let data = null;
      if (_card.set === '' && _card.number === '') {
        data = {... mapName.get(_card.name)};
      }
      else {
        data = {... mapSet.get(_card.set + _card.number)};
      }
      if(!data.name) {
        console.log("Missing data", data, _card);
        continue;
      }
      data.count = _card.count || 1;
      data.finish = _card.finish;
      data.tags = _card.tags;
      cardData.push(data);
    }
    upload.progress = 100;
  }
  catch (e) {
    console.error(e);
  }
  finally {
    upload.active = false;
    upload.count = 0;
    upload.progress = 0;
    upload.total = 0;
    return cardData;
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
    for (const [key, card] of cardList.entries()) {
      let existing = collection.cards.filter(c => {
        if(c === undefined) {
          return false;
        }
        if(card.set !== '') {
          return card.set === c.set && card.number === c.collector_number && card.finish === c.finish;
        }
        else {
          return card.name === c.name && card.finish === c.finish;
        }
      });
      if (existing.length > 0) {
        existing[0].count = card.count;
        cardList.delete(key);
      }
    }
  }
  if (cardList.size > 0) {
    const newData = await fetchCardData(cardList);
    cardData = cardData.concat(newData);
  }
  emit('change', name, cardData);
  emit('close');
};

const downloadCollection = async (name, code) => {
  const resp = await fetch(skyfallUrl + '/collection?id=' + code);
  const json = await resp.json();
  upload.active = false;
  emit('change', name, json.data, code);
  emit('close');
};

const refreshCollection = async (name) => {
  const collection = await props.db.collections.get({ name: name });
  if(!collection.syncCode) {
    return;
  }
  const resp = await fetch(skyfallUrl + '/collection?id=' + collection.syncCode);
  const json = await resp.json();
  emit('change', name, json.data, collection.syncCode);
};

const uploadCollection = async (name, force=false) => {
  toast(`Uploading ${name}`);
  const collection = await props.db.collections.get({ name: name });
  let data = {
    cards: collection.cards.map(c => c.id)
  };
  let code = collection.syncCode;
  if(code) {
    data.id = code;
  }
  const resp = await post(skyfallUrl + '/collection', data);
  code = resp.data;
  console.log(code);
  await props.db.collections.update(name, {
    "syncCode": code
  });
  navigator.clipboard.writeText(code);
  toast(`${name} uploaded. Code copied to clipboard`);
};

const copySyncCode = async (name) => {
  const collection = await props.db.collections.get({ name: name });
  navigator.clipboard.writeText(collection.syncCode);
};

</script>

<template>
  <div class="upload">
    <div class="flex">
      <button
        class="small close"
        @click="emit('close')"
      >
        <span>+</span>
      </button>

      <div
        class="collections"
        v-if="props.collections.length > 0"
      >
        <div
          class="collection"
          v-for="col in props.collections"
          :key="col"
        >
          <div>{{ col }}</div>
          <!-- <a
          class="action icon icon-arrow_downward"
        /> -->
          <a
            class="action icon icon-arrow_upward"
            @click.exact="uploadCollection(col)"
            @click.ctrl="uploadCollection(col, true)"
          />
          <a
            class="action icon icon-arrow_downward"
            @click.exact="refreshCollection(col)"
          />
          <a
            class="action icon icon-clipboard"
            @click.exact="copySyncCode(col)"
          />
          <a
            class="action"
            @click="upload.name = col"
          >+</a>
          <a
            class="action"
            @click="emit('delete', [col])"
          >-</a>
        </div>
      </div>
      <a
        href="#"
        @click="upload.name = ' '"
      >New collection</a>
      <div
        class="form"
        v-if="upload.name"
      >
        <h3>{{ props.collections.includes(upload.name) ? "Add to" : "Name" }}</h3>
        <input
          type="text"
          v-model="upload.name"
        >
        <h3>Format</h3>
        <Multiselect
          v-model="upload.format"
          :options="['DragonShield Web', 'DragonShield Mobile', 'MKM Email', 'MTGA', 'MTGO', 'Sync Code']"
          :can-clear="false"
        />

        <!-- <div>
        <label for="append">Append?</label>
        <input
          id="append"
          type="checkbox"
          v-model="upload.append"
        >
      </div> -->

        <template v-if="['MTGA', 'MTGO', 'MKM Email', 'Sync Code'].includes(upload.format)">
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
            @click="['MTGA', 'MTGO', 'MKM Email', 'Sync Code'].includes(upload.format) ? handleTextUpload() : handleFileUpload()"
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
  </div>
</template>

<style scoped>

.upload {
  position: absolute;
  padding: 1rem;
  inset: 0;
  overflow: auto;
}
.flex {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 20px;
}
.close {
  align-self: flex-end;
}
.close span {
  display: block;
  transform: rotate(45deg);
}
.collections {
  background-color: var(--colour-input-grey);
  max-height: 20rem;
  overflow: auto;
  width: 100%;
  max-width: 640px;
}
.collection {
  display: flex;
  gap: 1rem;
  flex-direction: row;
  height: 3rem;
  align-items: center;
  padding: 1rem;
  color: var(--colour-light-text);
}
.collection div:first-child {
  flex-grow: 1;
  font-weight: 500;
}
.form {
  display: grid;
  grid-template-columns: 1fr 5fr;
  gap: 20px;
  width: 100%;
  max-width: 640px;
  align-items: center;
}
/* .upload input[type="file"] {
  display: none;
} */
.file {
  grid-column: span 2;
  display: block;
  width: 100%;
  background-color: var(--colour-input-grey);
  height: 200px;
}
.buttons {
  grid-column: span 2;
  text-align: center;
}
input[type="file"] {
  display: none;
}
label {
  grid-column: 2;
}
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
</style>