// Mokona Imports — BANCO DE DADOS (salvo no navegador via localStorage)
// "products" = fichas técnicas + estoque | "orders" = pedidos feitos
(function(){
  const KEY="mokona_banco_v1";
  const SEED={"products": [{"id": "kingdom-hearts-ps2", "name": "Kingdom Hearts", "platform": "PS2", "code": "", "price": 3500, "stock": 3, "cost": 0, "buyDate": "", "buyPlace": "Mercari", "condition": "Bom", "general": "Bom", "disc": "Sem riscos, testado", "box": "Caixa com pequenas marcas", "channels": ["Mercari", "eBay"], "notes": "Exemplo baseado na ficha do PDF. Edite pelo modo admin.", "img": ""}], "orders": []};
  function load(){try{const d=JSON.parse(localStorage.getItem(KEY));if(d&&d.products)return d}catch(e){}return JSON.parse(JSON.stringify(SEED))}
  let data=load();const subs={};
  const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(data))}catch(e){alert("Sem espaço no navegador: use fotos menores.")}};
  const notify=n=>(subs[n]||[]).forEach(f=>f(snap(n)));
  const snap=n=>({docs:data[n].map(d=>({id:d.id,data:()=>{const{id,...r}=d;return r}}))});
  window.BancoDB={
    collection(n){
      data[n]=data[n]||[];
      return{
        onSnapshot(f){(subs[n]=subs[n]||[]).push(f);f(snap(n))},
        async add(o){const id="p"+Date.now();data[n].push({id,...o});save();notify(n);return{id}},
        doc(id){return{
          async get(){const d=data[n].find(x=>x.id===id);return{id,data:()=>{if(!d)return undefined;const{id:_,...r}=d;return r}}},
          async set(o){const i=data[n].findIndex(x=>x.id===id);const v={id,...o};i<0?data[n].push(v):data[n][i]=v;save();notify(n)},
          async update(o){const d=data[n].find(x=>x.id===id);if(d)Object.assign(d,o);save();notify(n)},
          async delete(){data[n]=data[n].filter(x=>x.id!==id);save();notify(n)}
        }}
      }
    },
    exportar(){const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:"application/json"}));a.download="banco.json";a.click()},
    resetar(){localStorage.removeItem(KEY);location.reload()}
  };
})();
