var te=Object.defineProperty;var q=Object.getOwnPropertySymbols;var oe=Object.prototype.hasOwnProperty,se=Object.prototype.propertyIsEnumerable;var K=(b,_,v)=>_ in b?te(b,_,{enumerable:!0,configurable:!0,writable:!0,value:v}):b[_]=v,J=(b,_)=>{for(var v in _||(_={}))oe.call(_,v)&&K(b,v,_[v]);if(q)for(var v of q(_))se.call(_,v)&&K(b,v,_[v]);return b};import{r as E,w as le,o as C,c as k,a as o,t as V,u as e,n as A,F as M,b as F,d as B,v as j,e as P,f as O,g as D,P as ne,k as R,h as G,i as ae,j as Q,l as L,m as Y,p as H,q as X,D as re,s as ie,x as Z,y as ce,z as ue,A as de}from"./vendor.bcf2eb3b.js";const pe=function(){const _=document.createElement("link").relList;if(_&&_.supports&&_.supports("modulepreload"))return;for(const t of document.querySelectorAll('link[rel="modulepreload"]'))y(t);new MutationObserver(t=>{for(const h of t)if(h.type==="childList")for(const T of h.addedNodes)T.tagName==="LINK"&&T.rel==="modulepreload"&&y(T)}).observe(document,{childList:!0,subtree:!0});function v(t){const h={};return t.integrity&&(h.integrity=t.integrity),t.referrerpolicy&&(h.referrerPolicy=t.referrerpolicy),t.crossorigin==="use-credentials"?h.credentials="include":t.crossorigin==="anonymous"?h.credentials="omit":h.credentials="same-origin",h}function y(t){if(t.ep)return;t.ep=!0;const h=v(t);fetch(t.href,h)}};pe();const me={class:"filter-group colours"},fe={class:"header"},_e=["data-colour"],ye=["value","id"],he=["for"],ve={props:{modelValue:{type:Object,default:()=>({colours:[],or:!1})}},emits:["update:modelValue"],setup(b,{emit:_}){const v={Red:"R",Green:"G",Black:"B",Blue:"U",White:"W",Colourless:"C"},y=E({colours:[],or:!1}),t={Azorius:["U","W"],Boros:["R","W"],Dimir:["B","U"],Golgari:["B","G"],Gruul:["G","R"],Izzet:["R","U"],Orzhov:["B","W"],Rakdos:["B","R"],Selesnya:["G","W"],Simic:["G","U"]},h={Abzan:["B","G","W"],Bant:["G","U","W"],Esper:["B","U","W"],Grixis:["B","R","U"],Jeskai:["R","U","W"],Jund:["B","G","R"],Mardu:["B","R","W"],Naya:["G","R","W"],Sultai:["B","G","U"],Temur:["G","R","U"]},T={Glint:"W",Dune:"U",Ink:"B",Witch:"R",Yore:"G"};le(()=>{_("update:modelValue",y)});const N=g=>{let w=[...g].sort();if(g.length===2){for(const[p,n]of Object.entries(t))if(w.every((r,m)=>r===n[m]))return p}else if(g.length===3){for(const[p,n]of Object.entries(h))if(w.every((r,m)=>r===n[m]))return p}else if(g.length===4){for(const[p,n]of Object.entries(T))if(!g.includes(n))return p}};return(g,w)=>(C(),k("div",me,[o("div",fe,[o("h3",null,"Colours "+V(e(y).colours.length>1?`(${N(e(y).colours)})`:""),1),o("div",{class:A(["bi-toggle",{active:e(y).or}]),onClick:w[0]||(w[0]=p=>e(y).or=!e(y).or)},V(e(y).or?"And":"Or"),3)]),(C(),k(M,null,F(v,p=>o("div",{class:A(["input-group colour",e(y).colours.includes(p)?"selected":""]),"data-colour":p,key:p},[B(o("input",{type:"checkbox","onUpdate:modelValue":w[1]||(w[1]=n=>e(y).colours=n),value:p,id:p},null,8,ye),[[j,e(y).colours]]),o("label",{for:p,class:A("icon icon-"+p)},null,10,he)],10,_e)),64))]))}};const ge={class:"filter-group rarities"},be=o("h3",null,"Rarity",-1),Ce=["data-rarity"],we=["onUpdate:modelValue","value","id"],ke=["for","title"],$e={class:"filter-group"},xe=o("h3",null,"Name",-1),Se={class:"filter-group mana"},Ve=o("h3",null,"Mana Cost",-1),Ue={class:"filter-group"},Te=o("h3",null,"Types",-1),Ge={class:"filter-group"},Ne=o("h3",null,"Keywords",-1),Ee={class:"filter-group"},Oe=o("h3",null,"Card text",-1),Be={class:"filter-group"},Me=o("h3",null,"Set",-1),Re={key:0,class:"filter-group compare"},Ae=o("h3",null,"Compare",-1),Fe={class:"grid"},Ie=["id","onUpdate:modelValue"],je=["for"],Pe=["id","onUpdate:modelValue"],De=["for"],Le={props:{cards:{type:Array,default:()=>[]},collections:{type:Array,default:()=>[]},sort:{type:String,default:"Price"},db:{type:Object,default:()=>{}}},emits:["change","loading"],setup(b,{emit:_}){const v=b;let y=E({keywords:[],sets:[],tribes:[],allSets:[]}),t=E({colours:{colours:[],or:!1},rarity:[],keywords:[],tribes:[],name:"",cardText:"",sets:[],mana:[0,20],dupesOnly:!1,sort:"Price",incCol:{},excCol:{},ors:{}});const h=["special","mythic","rare","uncommon","common"],T=async(p,n)=>{const r=new Request(n);let m=await p.match(r);return m||(await p.add(r),m=await p.match(r)),await m.json()};caches.open("cardDataCache").then(async p=>{let n=await T(p,"https://api.scryfall.com/catalog/creature-types");y.tribes=n.data,y.tribes=y.tribes.concat(["Enchantment","Sorcery","Land","Creature","Instant","Artifact"]);let r=await T(p,"https://api.scryfall.com/sets");y.allSets=r.data});const N=(p,n)=>{if(t.sort==="Price")return p.price?p.price<n.price?1:-1:!0;if(t.sort==="Mana")return parseFloat(p.cmc)<parseFloat(n.cmc)?1:-1;if(t.sort==="Count")return parseFloat(p.count)<parseFloat(n.count)?1:-1},g=async(p,n)=>new Promise(async r=>{let m=setTimeout(()=>_("loading"),300),i=p.sort(N);if(n.cardText&&n.cardText!==""){const c=new ae(i,{ignoreLocation:!0,threshold:.5,findAllMatches:!0,keys:["oracle_text","card_faces.oracle_text"]});i=[],c.search(n.cardText).forEach(d=>{i.push(d.item)})}for(const c of Object.keys(n.incCol)){if(!n.incCol[c])continue;const $=(await v.db.collections.get({name:c})).cards.map(a=>a.oracle_id);i=i.filter(a=>$.includes(a.oracle_id))}for(const c of Object.keys(n.excCol)){if(!n.excCol[c])continue;const $=(await v.db.collections.get({name:c})).cards.map(a=>a.oracle_id);i=i.filter(a=>!$.includes(a.oracle_id))}let u=0,f=0;i=i.filter(c=>{if(n.dupesOnly&&c.count===1||!(!n.name||!n.name!=""||c.name.toLowerCase().includes(n.name.toLowerCase())))return!1;const $=S=>n.colours.or?n.colours.colours.every(S):n.colours.colours.some(S);if(n.colours.colours.length>0&&!$(z=>z==="C"?c.color_identity.length===0:(c.color_identity||[]).includes(z))||!n.keywords.every(S=>(c.keywords||[]).includes(S)))return!1;const l=n.tribes.some(S=>(c.type_line.toLowerCase()||"").includes(S.toLowerCase()));if(n.tribes.length>0&&!l||!(n.rarity.length>0?[...n.rarity].includes(c.rarity):!0))return!1;let x=!0;return n.sets.length>0&&(x=n.sets.some(S=>c.set===S)),!x||!(c.cmc>=n.mana[0]&&c.cmc<=n.mana[1])?!1:(f+=c.price,!0)}),f=parseInt(f),u=i.length,clearTimeout(m),r([i,u,f])});P(()=>v.cards,async(p,n)=>{const r=new Set,m=[];let i=.9;p.forEach(d=>{d.price=parseFloat(d.prices.eur||parseFloat(d.prices.usd)*i||0),d.keywords.forEach($=>{r.add($)}),m[d.set]=d.set_name}),y.keywords=[...r],y.sets=Object.keys(m).map(d=>({set:d,setName:m[d]}));let[u,f,c]=await g(p,t);_("change",u,f,c)}),P(()=>v.sort,(p,n)=>{t.sort=p});let w=null;return P(t,async()=>{clearTimeout(w),w=setTimeout(async()=>{let[p,n,r]=await g(v.cards,t);_("change",p,n,r)},500)}),(p,n)=>(C(),k("div",null,[O(ve,{modelValue:e(t).colours,"onUpdate:modelValue":n[0]||(n[0]=r=>e(t).colours=r)},null,8,["modelValue"]),o("div",ge,[be,(C(),k(M,null,F(h,r=>o("div",{class:"input-group rarity","data-rarity":r,key:r},[B(o("input",{type:"checkbox","onUpdate:modelValue":m=>e(t).rarity=m,value:r,id:r},null,8,we),[[j,e(t).rarity]]),o("label",{for:r,title:r},null,8,ke)],8,Ce)),64))]),o("div",$e,[xe,B(o("input",{type:"search","onUpdate:modelValue":n[1]||(n[1]=r=>e(t).name=r)},null,512),[[D,e(t).name]])]),o("div",Se,[Ve,O(e(ne),{modelValue:e(t).mana,"onUpdate:modelValue":n[2]||(n[2]=r=>e(t).mana=r),min:0,max:20},null,8,["modelValue"])]),o("div",Ue,[Te,O(e(R),{modelValue:e(t).tribes,"onUpdate:modelValue":n[3]||(n[3]=r=>e(t).tribes=r),options:e(y).tribes,searchable:!0,mode:"tags","create-option":!0},null,8,["modelValue","options"])]),o("div",Ge,[Ne,O(e(R),{modelValue:e(t).keywords,"onUpdate:modelValue":n[4]||(n[4]=r=>e(t).keywords=r),options:e(y).keywords,searchable:!0,mode:"tags"},null,8,["modelValue","options"])]),o("div",Ee,[Oe,B(o("input",{type:"search","onUpdate:modelValue":n[5]||(n[5]=r=>e(t).cardText=r)},null,512),[[D,e(t).cardText]])]),o("div",Be,[Me,O(e(R),{modelValue:e(t).sets,"onUpdate:modelValue":n[6]||(n[6]=r=>e(t).sets=r),options:e(y).sets,label:"setName","value-prop":"set",searchable:!0,mode:"tags"},null,8,["modelValue","options"])]),b.collections.length>0?(C(),k("div",Re,[Ae,o("div",Fe,[(C(!0),k(M,null,F(b.collections,r=>(C(),k(M,{key:r},[o("div",null,V(r),1),o("div",null,[B(o("input",{type:"checkbox",id:r+"-inc","onUpdate:modelValue":m=>e(t).incCol[r]=m,value:!1},null,8,Ie),[[j,e(t).incCol[r]]]),o("label",{class:"inc",for:r+"-inc"},null,8,je)]),o("div",null,[B(o("input",{type:"checkbox",id:r+"-exc","onUpdate:modelValue":m=>e(t).excCol[r]=m,value:!1},null,8,Pe),[[j,e(t).excCol[r]]]),o("label",{class:"exc",for:r+"-exc"},null,8,De)])],64))),128))])])):G("",!0)]))}};var ee=(b,_)=>{const v=b.__vccOpts||b;for(const[y,t]of _)v[y]=t;return v};const W=b=>(H("data-v-4ef910ec"),b=b(),X(),b),We={class:"upload"},ze=W(()=>o("span",null,"+",-1)),qe=[ze],Ke={class:"form"},Je=W(()=>o("h3",null,"Name",-1)),Qe=W(()=>o("h3",null,"Format",-1)),Ye={key:1,class:"button",for:"file-input"},He=["disabled"],Xe={key:3,class:"buttons"},Ze={key:4,class:"progress"},et={props:{db:Object,collections:Array,setIds:Set},emits:["change","close"],setup(b,{emit:_}){const v=b,y="https://api.scryfall.com/cards/collection",t=E({name:null,file:null,text:null,encoding:null,format:null,active:!1,progress:0,count:0,total:0}),h=async(m="",i={})=>(await fetch(m,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(i)})).json(),T=async m=>{let i=await m.arrayBuffer(),u=new Uint8Array(i.slice(0,10));return u[0].toString(16)=="ff"&&u[1].toString(16)=="fe"?"UTF-16LE":u[0].toString(16)=="fe"&&u[1].toString(16)=="ff"?"UTF-16BE":u[1]==0&&u[3]==0&&u[5]==0?"UTF-16LE":"UTF-8"},N=async m=>{t.active=!0,t.progress=0;let i={};if(t.format==="MTGA"){const u=/([0-9]+) (.+) \((.+)\) ([0-9]+)/g,f=t.text.matchAll(u);for(const c of f)i[c[3]+c[4]]={name:c[2].split(" // ")[0],count:parseInt(c[1]),set:c[3],number:c[4]}}else if(t.format==="MTGO"){const u=/([0-9]+) (.+)/g,f=t.text.matchAll(u);for(const c of f)i[c[2]]={name:c[2].split(" // ")[0],count:parseInt(c[1]),set:"",number:""}}r(t.name,i)},g=async m=>{if(w.value.files.length===0)return;let i=w.value.files[0];const u=new FileReader;t.active=!0,t.progress=0;let f=null;t.format==="DragonShield Web"&&(f=p),u.onload=async()=>{let d=await f(u.result);r(t.name,d)};let c=await T(i);u.readAsText(i,c)},w=Q(null);L.parsePromise=m=>new Promise((i,u)=>{L.parse(m,{header:!0,worker:!0,skipEmptyLines:!0,dynamicTyping:!0,complete:i,error:u})});const p=async m=>{m=m.replace('"sep=,"',"");let i=await L.parsePromise(m),u={};return i.data.forEach(f=>{const c=f["Set Name"];let d=f["Set Code"].toLowerCase();v.setIds.has(d)?u[d+f["Card Number"]]={name:f["Card Name"],count:parseInt(f.Quantity),set:d,number:f["Card Number"].toString()}:(console.log(`Couldn't find set for ${f["Card Name"]} ${f["Card Number"]} ${c} [${d}]`),u[d+f["Card Number"]]={name:f["Card Name"],count:parseInt(f.Quantity),set:"",number:""})}),u},n=async m=>{const i=[],u={};try{let f=[];for(const[c,d]of Object.entries(m)){let $={};d.set===""&&d.number===""?($.name=d.name,u[d.name]=d.count):($.set=d.set,$.collector_number=d.number,u[d.set+d.number]=d.count),i.push($)}t.total=i.length;for(let c=0;c<i.length;c+=75){const d=await h(y,{identifiers:i.slice(c,c+75)});d.not_found.length>0&&console.log(d.not_found);let $=d.data.map(a=>(a.count=u[a.name]||u[a.set+a.collector_number],a));f=f.concat($),t.count=c,t.progress=c/i.length*100,await new Promise(a=>setTimeout(a,100))}return t.progress=100,f}catch(f){console.error(f)}finally{t.active=!1,t.count=0,t.progress=0,t.total=0,_("close")}},r=async(m,i,u=!0)=>{let f=[];if(u&&v.collections.includes(m)){const c=await v.db.collections.get({name:m});f=c.cards;for(const[d,$]of Object.entries(i)){let a=c.cards.filter(l=>$.set!==""&&$.set===l.set&&$.number===l.collector_number?!0:l.name===$.name);a.length>0&&(a[0].count=$.count,delete i[d])}}if(i){const c=await n(i);f=f.concat(c)}_("change",m,f)};return(m,i)=>(C(),k("div",We,[o("button",{class:"small close",onClick:i[0]||(i[0]=u=>_("close"))},qe),o("div",Ke,[Je,B(o("input",{type:"text","onUpdate:modelValue":i[1]||(i[1]=u=>e(t).name=u)},null,512),[[D,e(t).name]]),Qe,O(e(R),{modelValue:e(t).format,"onUpdate:modelValue":i[2]||(i[2]=u=>e(t).format=u),options:["DragonShield Web","DragonShield Mobile","MTGA","MTGO"],"can-clear":!1},null,8,["modelValue"]),["MTGA","MTGO"].includes(e(t).format)?B((C(),k("textarea",{key:0,"onUpdate:modelValue":i[3]||(i[3]=u=>e(t).text=u)},null,512)),[[D,e(t).text]]):G("",!0),["DragonShield Web","DragonShield Mobile"].includes(e(t).format)?(C(),k("label",Ye,"Choose file")):G("",!0),e(t).format==="DragonShield Web"?(C(),k("input",{key:2,id:"file-input",ref_key:"fileElem",ref:w,type:"file",disabled:e(t).active},null,8,He)):G("",!0),!e(t).active&&e(t).format&&(e(t).text||w.value)?(C(),k("div",Xe,[o("button",{onClick:i[4]||(i[4]=u=>["MTGA","MTGO"].includes(e(t).format)?N():g())}," Upload ")])):G("",!0),e(t).active?(C(),k("div",Ze,[o("span",null,"Processing cards: "+V(e(t).count)+" / "+V(e(t).total),1),o("div",{class:"bar",style:Y({width:e(t).progress+"%"})},null,4)])):G("",!0)])]))}};var tt=ee(et,[["__scopeId","data-v-4ef910ec"]]);const I=b=>(H("data-v-08ff1090"),b=b(),X(),b),ot={id:"window"},st={id:"sidebar"},lt={class:"filter-group collections"},nt=I(()=>o("h3",null,"View Collection",-1)),at={class:"filter-group"},rt=I(()=>o("h3",null,"View Set",-1)),it={class:"filter-group"},ct=I(()=>o("h3",null,[ce(" Scryfall Search "),o("a",{href:"https://scryfall.com/docs/syntax",target:"_blank"},"?")],-1)),ut=I(()=>o("hr",null,null,-1)),dt={id:"main"},pt={key:0,class:"loader"},mt={class:"info-bar"},ft=I(()=>o("span",{class:"icon icon-content_paste"},null,-1)),_t={class:"sort"},yt=I(()=>o("span",{class:"icon icon-content_paste"},null,-1)),ht={class:"clip-cards"},vt={class:"buttons"},gt={class:"menu-button"},bt={class:"menu-button"},Ct=["onClick"],wt={class:"img"},kt=["src"],$t=["src"],xt=["src"],St=["onClick"],Vt={class:"name"},Ut={setup(b){const _=new re("mtg");_.version(2).stores({collections:"&name"});const v=E({allSets:[]}),y=E({count:0,total_value:0,zoom:0}),t=E({cards:[]}),h=E({upload:!1,clipboard:!1,menu:!1,random:{},selector:"collection"}),T=new Set;let N=Q(!1);const g=E({collections:[],all:[],filtered:[],sort:"Price"});let w=E({value:[]});const p=async(a,l)=>{const s=new Request(l);let x=await a.match(s);return x||(await a.add(s),x=await a.match(s)),await x.json()},n=async a=>{if(a===[])return;let l=new Map;for(const s of a){let x=await _.collections.get({name:s});for(const U of x.cards)if(l.has(U.id)){let S=l.get(U.id);S.count=parseInt(S.count)+parseInt(U.count),l.set(U.id,S)}else l.set(U.id,U)}g.all=[...l.values()]},r=async a=>{m("e:"+a)},m=async(a,l="prints")=>{let s="https://api.scryfall.com/cards/search?"+new URLSearchParams({q:`${a} -border:silver -is:digital`,unique:l}),x=[];N.value=!0;try{for(;;){let U=await p(f,s);if(x=x.concat(U.data),!U.has_more)break;s=U.next_page,await new Promise(S=>setTimeout(S,100))}g.all=x}finally{N.value=!1}},i=async a=>{if(confirm(`Are you sure you want to delete ${a.join(", ")}?`))a.map(async l=>{await _.collections.delete(l),g.collections.pop(l),w.value.pop(l)});else return};P(w,a=>n(a.value));const u=async(a,l,s)=>{y.count=l,y.total_value=s,g.filtered=a,N.value=!1};_.collections.toCollection().primaryKeys().then(a=>{a.length!==0&&(g.collections=a.sort(),w.value=[a[0]])});let f=null;caches.open("cardDataCache").then(async a=>{f=a;let l=await p(a,"https://api.scryfall.com/sets");l.data.forEach(s=>T.add(s.code)),v.allSets=l.data});const c=async(a,l)=>{await _.collections.put({name:a,cards:l}),g.collections.includes(a)||g.collections.push(a),w.value=[a]},d=async a=>{let l="";a==="mtgo"?t.cards.forEach(s=>{l+=(s.count||1)+" "+s.name+`
`}):a==="moxfield"&&(l=`"Count","Tradelist Count","Name","Edition","Condition","Language","Foil","Tags","Last Modified","Collector Number"
`,t.cards.forEach(s=>{l+=`"${s.count||1}","0","${s.name}","${s.set}","Near Mint","English","","","2022-03-22 02:52:33.210000","${s.collector_number}"
`})),navigator.clipboard.writeText(l)},$=async(a,l)=>{let s=await _.collections.get({name:a});for(const x of l){let U=s.cards.filter(S=>S.id===x.id);console.log(U),U.length===0?s.cards.push(J({},ue.deepUnref(x))):U[0].count+=x.count}await _.collections.put(s),w.value.includes(a)&&(g.all=g.all.concat(newCard))};return(a,l)=>(C(),k("div",ot,[o("div",st,[o("div",lt,[nt,O(e(R),{modelValue:e(w).value,"onUpdate:modelValue":l[0]||(l[0]=s=>e(w).value=s),options:e(g).collections,mode:"tags",searchable:!0},null,8,["modelValue","options"]),o("button",{class:"small add",onClick:l[1]||(l[1]=s=>e(h).upload=!0)}," + "),o("button",{class:"small remove",onClick:l[2]||(l[2]=s=>i(e(w).value))}," - ")]),o("div",at,[rt,O(e(R),{options:e(v).allSets,label:"name","value-prop":"code",searchable:!0,mode:"single",onSelect:r,onLoading:l[3]||(l[3]=s=>e(N).value=!0)},null,8,["options"])]),o("div",it,[ct,o("input",{type:"search",onKeyup:l[4]||(l[4]=ie(s=>m(s.currentTarget.value,"cards"),["enter"]))},null,32)]),ut,O(Le,{onChange:u,cards:e(g).all,collections:e(g).collections,db:e(_),sort:e(g).sort},null,8,["cards","collections","db","sort"])]),o("div",dt,[e(N)?(C(),k("div",pt," Loading ")):G("",!0),e(h).upload?(C(),Z(tt,{key:1,onChange:c,onClose:l[5]||(l[5]=s=>e(h).upload=!1),db:e(_),collections:e(g).collections,"set-ids":e(T)},null,8,["db","collections","set-ids"])):G("",!0),o("div",mt,[o("span",null,"Count: "+V(e(y).count),1),o("span",null,"Value: "+V(new Intl.NumberFormat("en-GB",{style:"currency",currency:"EUR"}).format(e(y).total_value)),1),o("span",{class:"clip",onClick:l[6]||(l[6]=s=>e(h).clipboard=!e(h).clipboard)},[ft,o("span",null,V(e(t).cards.length),1)]),o("span",_t,[O(e(R),{modelValue:e(g).sort,"onUpdate:modelValue":l[7]||(l[7]=s=>e(g).sort=s),options:["Mana","Price","Count"],mode:"single","can-clear":!1},null,8,["modelValue"])])]),o("div",{class:A(["clipboard",{show:e(h).clipboard}])},[o("div",{class:"menu",onClick:l[8]||(l[8]=s=>e(h).clipboard=!e(h).clipboard)},[yt,o("span",null,V(e(t).cards.length),1)]),o("h3",null,"Clipboard "+V(new Intl.NumberFormat("en-GB",{style:"currency",currency:"EUR"}).format(e(t).cards.reduce((s,x)=>s+=x.price,0))),1),o("div",ht,[(C(!0),k(M,null,F(e(t).cards,s=>(C(),k("div",{class:"clip-card",key:"clip-"+s.name},[o("p",null,"1 "+V(s.name),1)]))),128))]),o("div",vt,[o("div",gt,[o("button",{onClick:l[9]||(l[9]=s=>e(h).random.clipExports=!e(h).random.clipExports)}," Export "),o("div",{class:A(["v-menu",{show:e(h).random.clipExports}])},[o("button",{onClick:l[10]||(l[10]=s=>d("mtgo"))}," MTGO "),o("button",{onClick:l[11]||(l[11]=s=>d("moxfield"))}," Mox ")],2)]),o("div",bt,[o("button",{onClick:l[12]||(l[12]=s=>e(h).random.addToSet=!e(h).random.addToSet)}," Add to set "),o("div",{class:A(["v-menu",{show:e(h).random.addToSet}])},[(C(!0),k(M,null,F(e(w).value,s=>(C(),k("button",{onClick:x=>$(s,e(t).cards),key:s},V(s),9,Ct))),128))],2)]),o("button",{onClick:l[13]||(l[13]=s=>e(t).cards=e(t).cards.concat(e(g).filtered))}," Clip All "),o("button",{onClick:l[14]||(l[14]=s=>e(t).cards=[])}," Clear ")])],2),e(h).upload?G("",!0):(C(),k("div",{key:2,class:"cards",style:Y({"font-size":18+e(y).zoom*2+"px"})},[(C(!0),k(M,null,F(e(g).filtered.slice(0,500),s=>(C(),k("div",{class:"card",key:s.id},[o("div",wt,[s.image_uris?(C(),k("img",{key:0,src:s.image_uris.normal},null,8,kt)):G("",!0),s.card_faces&&s.card_faces[0].image_uris?(C(),k("img",{key:1,class:"flip front",src:s.card_faces[0].image_uris.normal},null,8,$t)):G("",!0),s.card_faces&&s.card_faces[0].image_uris?(C(),k("img",{key:2,class:"flip back",src:s.card_faces[1].image_uris.normal},null,8,xt)):G("",!0),o("button",{class:"small clip icon icon-add",onClick:x=>e(t).cards.push(s)},null,8,St)]),o("p",Vt,V(s.count)+" "+V(s.name),1),o("p",null,V(s.set_name)+" ["+V(s.set)+"]",1),o("p",null,V(new Intl.NumberFormat("en-GB",{style:"currency",currency:"EUR"}).format(s.price)),1)]))),128))],4))])]))}};var Tt=ee(Ut,[["__scopeId","data-v-08ff1090"]]);const Gt={setup(b){return(_,v)=>(C(),Z(Tt))}},Nt=de(Gt);Nt.mount("#app");
