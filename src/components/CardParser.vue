<script setup>

import { reactive, ref, watchEffect } from 'vue';
import Papa from 'papaparse';
import Multiselect from '@vueform/multiselect';
import CardSearch from './CardSearch.vue';
import { useCollections } from '../stores/collections';
import { useMeta } from '../stores/meta';

const collections = useCollections();
const meta = useMeta();

const emit = defineEmits(['parsed']);
const backendUrl = import.meta.env.VITE_BACKEND_URL;
const upload = reactive({
  name: null,
  file: null, 
  text: null, 
  append: true, 
  encoding: null, 
  format: "Search", 
  active: false, 
  progress: 0, 
  count: 0, 
  total: 0
});

watchEffect(() => {
  upload.name = collections.open[0];
});

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
    const re = /([0-9]+)x ([a-zA-Z ,/']+)/g;
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
    if (!meta.setIds.has(setCode)) {
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

const updateCollection = async (name, cardList) => {
  let collection = await collections.get(name);

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
  if (cardList.size > 0) {
    const newData = await fetchCardData(cardList);
    collection.cards = collection.cards.concat(newData);
  }
  collections.save(name, collection.cards, collection.syncCode);
  upload.active = false;
  upload.count = 0;
  upload.progress = 0;
  upload.total = 0;
  emit('parsed', collections.open);
};

const handleSearch = async (data) => {
  data.count = 1;
  const collection = await collections.get(upload.name);
  let existing = collection.cards.filter(c => {
    return c.id === data.id && c.finish === 'nonfoil';
  });
  if (existing.length > 0) {
    existing[0].count += 1;
  }
  else {
    collection.cards.push(data);
  }
  collections.save(upload.name, collection.cards, collection.syncCode);
  emit('parsed', collections.open);
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
      const resp = await post(backendUrl + '/cards', { identifiers: ids.slice(i, i + chunk) });
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
    return cardData;
  }
};

const formats = {
  'MKM Email': ['text', handleTextUpload],
  'MTGA': ['text', handleTextUpload],
  'MTGO': ['text', handleTextUpload],
  'DragonShield Web': ['file', handleFileUpload],
  'Search': ['search', handleSearch]
};
</script>

<template>
  <div
    class="root"
  >
    <h3>Add to {{ collections.open.length == 1 ? collections.open[0] : "" }}</h3>
    <Multiselect
      v-if="collections.open.length > 1"
      v-model="upload.name"
      :options="collections.open"
      mode="single"
    />

    <Multiselect
      v-model="upload.format"
      placeholder="Format"
      :options="Object.keys(formats)"
      :can-clear="false"
    />

    <input
      v-if="formats[upload.format][0] === 'file'"
      id="file-input"
      ref="fileElem"
      type="file"
      :disabled="upload.active"
    >

    <template v-if="formats[upload.format][0] === 'text'">
      <textarea v-model="upload.text" />
    </template>

    <CardSearch
      v-if="formats[upload.format][0] === 'search'"
      @selected="handleSearch"
    />

    <div
      class="buttons"
    >
      <label
        class="button"
        for="file-input"
        v-if="formats[upload.format][0] === 'file'"
      >Choose file</label>
      <button
        v-if="!upload.active && upload.format && (upload.text || fileElem)"
        @click="formats[upload.format][1]()"
      >
        Add
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
</template>

<style scoped>

.root {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  max-width: 640px;
  align-items: center;
}
/* .upload input[type="file"] {
  display: none;
} */
.file {
  display: block;
  width: 100%;
  background-color: var(--colour-input-grey);
  height: 200px;
}
.buttons {
  display: flex;
  flex-direction: row;
  text-align: center;
  gap: 1rem;
}
label.button {
  display: block;
}
input[type="file"] {
  display: none;
}
.progress {
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