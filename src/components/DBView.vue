<script setup lang="ts">
import { onMounted, reactive, watchEffect } from 'vue';
import sqlite from '../utils/db'
import * as monaco from 'monaco-editor'
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'

const ui = reactive({
  'query': `
select 
  id, 
  data->'name' as name, 
  cast(data->'prices'->>'usd' as real) as usd_price
from card
order by usd_price desc
limit 100
`.trim(),
  'results': null,
  'error': null,
  'column_count': 1,
  'column_style': '',
  'elemIndex': 0,
  'startX': 0,
  'startW': 0,
  'resizeTarget': null,
});

let editor = null;

watchEffect(() => {
  ui.column_count = ui.results && ui.results.length > 0 ? Object.keys(ui.results[0]).length : 1
})


const onMouseMove = (e: MouseEvent) => requestAnimationFrame(() => {
  e.stopPropagation();
  e.preventDefault();
  const offset = ui.startX - e.clientX;
  const widths = ui.column_style.split(' ');
  widths[ui.elemIndex] = `${ui.startW - offset}px`
  ui.column_style = widths.join(' ');
});

const onMouseUp = () => {
  window.removeEventListener('mousemove', onMouseMove);
  window.removeEventListener('mouseup', onMouseUp);
  ui.resizeTarget = null;
};

const initResize = (e: MouseEvent, index: number) => {
  ui.startX = e.clientX;
  ui.resizeTarget = e.target.parentNode;
  ui.startW = ui.resizeTarget.offsetWidth;
  ui.elemIndex = index;
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
};

const model = monaco.editor.createModel(ui.query, "sql");

const runQuery = async () => {
  ui.error = null;
  ui.results = null;
  try {
    ui.results = await sqlite.executeSql(editor.getValue());
  }
  catch(e) {
    ui.error = e.message;
    // monaco.editor.setModelMarkers(model, "qads-repl", [
    //   {
    //     message: `${e}`,
    //     severity: monaco.MarkerSeverity.Error,
    //     ...model.getFullModelRange(),
    //   },
    // ]);
  }
  console.log(ui.results);
  if(!ui.results || ui.results.length == 0) return
  ui.column_count = Object.keys(ui.results[0]).length;
  ui.column_style = Array(ui.column_count).fill('auto').join(' ');
}

import theme from "../assets/theme.json"

onMounted(async () => {
  monaco.editor.defineTheme('mytheme', theme);
  monaco.editor.setTheme('mytheme');
  editor = monaco.editor.create(document.getElementById("monaco-editor"), {
    model,
    value: ui.query,
    language: 'pgsql',
    theme: 'mytheme',
	  // lineNumbers: "off",
    minimap: { enabled: false },
    fontSize: 16,
    scrollBeyondLastLine: false,
    wordWrap: "on",
    overviewRulerLanes: 0,
  })
  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => runQuery())
});

self.MonacoEnvironment = {
  getWorker(_, label) {
		return new editorWorker();
  }
}

</script>


<template>
  <div class="db-view">
    <div id="monaco-editor"></div>
    <!-- <textarea class="query" v-model="ui.query"></textarea> -->
    <div class="actions">
      <div class="error">{{ ui.error }}</div>
      <button @click="ui.results = null">Clear</button>
      <button @click="runQuery">Run</button>
    </div>
    <table v-if="ui.results && ui.results.length > 0" class="results" :style="{
        'grid-template-columns': ui.column_style,
        'user-select': ui.resizeTarget ? 'none' : 'unset'
      }">
      <thead>
        <tr class="header row">
          <th class="th" v-for="(key, index) in Object.keys(ui.results[0])">
            {{ key }}
            <span class="resize-anchor" @mousedown="(e) => initResize(e, index)"></span>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr class="row" v-for="row in ui.results">
          <td class="td" v-for="col in Object.values(row)">
            {{ col }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>

#monaco-editor {
  display: block;
  max-height: 600px;
  min-height: 300px;
  width: 800px;
  margin-bottom: 1rem;
}
.query {
  width: 800px;
  margin-bottom: 1rem;
  resize: vertical;
  min-height: fit-content;
  font-family: 'monospace', monospace;
  font-size: 1.2rem;
}
.actions {
  width: 100%;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: 1rem;
  gap: 1rem;
  color: var(--colour-error);
}

.error {
  text-align: left;
  width: 100%;
}

table {
  display: grid;
  border-collapse: collapse;
  width: 800px;
  max-height: 640px;
  text-align: left;
  overflow: auto;
  gap: 0;
  background-color: var(--colour-input-grey);
  scrollbar-gutter: stable;
}

thead, tbody, tr {
  display: contents;
}


th {
  position: relative;
  line-height: 3;
  letter-spacing: 0px;
  text-transform: uppercase;
  white-space: nowrap;
  text-indent: .5rem;
  position: sticky;
  top: 0;
  background-color: var(--colour-input-grey);
  font-weight: 600;
  box-shadow: 5px 0 10px 0 rgba(0, 0, 0, 0.5);
  overflow: hidden;
}

.resize-anchor {
  position: absolute;
  top: 0;
  bottom: 0;
  right: 0;
  width: 10px;;
  /* border-left: 1px solid #000000a6; */
  /* box-shadow: 0 -1px 0 1px #ffffff1f; */
  cursor: ew-resize;  
  background-color: var(--colour-input-grey);
  background-color: #c77cd42e;
}

td {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  border-bottom: 1px solid rgba(0,0,0,0.2);
  text-indent: .5rem;
}

tr {
  line-height: 2;
}
tr:nth-child(odd) td {
  background-color: rgba(0, 0, 0, 0.3);
}

</style>