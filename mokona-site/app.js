// Mokona Imports — lógica da loja (carrinho, ficha técnica, baixa de estoque)
const $=id=>document.getElementById(id);
const esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const yen=n=>"¥ "+Number(n||0).toLocaleString("ja-JP");
const CH=["Mercari","Yahoo!フリマ","Yahoo!オークション","eBay","Outro"];
const CONDS=["Novo / lacrado","Excelente","Bom","Regular","Com defeitos"];
let P=[],cart={},plat="Todos",isAdmin=false,db=null,local=false;
try{cart=JSON.parse(localStorage.getItem("mk_cart")||"{}")}catch(e){}
const saveCart=()=>{try{localStorage.setItem("mk_cart",JSON.stringify(cart))}catch(e){}$("cc").textContent=Object.values(cart).reduce((a,b)=>a+b,0)};
const toast=m=>{const t=$("t");t.textContent=m;t.style.display="block";clearTimeout(toast.h);toast.h=setTimeout(()=>t.style.display="none",2600)};
const open=(o,h)=>{if(h!=null)o.firstElementChild.innerHTML=h;o.classList.add("on")};
document.querySelectorAll(".ov").forEach(o=>o.addEventListener("click",e=>{if(e.target===o)o.classList.remove("on")}));
const close=id=>$(id).classList.remove("on");

function ph(p){return p.img?`<img src="${esc(p.img)}" alt="">`:"🎮"}
function render(){
  const plats=["Todos",...new Set(P.map(p=>p.platform).filter(Boolean))];
  $("chips").innerHTML=plats.map(x=>`<button class="chip ${x===plat?"on":""}" data-p="${esc(x)}">${esc(x)}</button>`).join("");
  const q=$("q").value.toLowerCase();
  const l=P.filter(p=>(plat==="Todos"||p.platform===plat)&&(p.name||"").toLowerCase().includes(q));
  $("grid").innerHTML=l.length?l.map(p=>`<div class="card" data-id="${p.id}"><div class="ph">${ph(p)}</div><div class="b"><span class="plat">${esc(p.platform)}</span><b>${esc(p.name)}</b><span class="price">${yen(p.price)}</span><span class="stk ${p.stock>0?"":"out"}">${p.stock>0?"Estoque: "+p.stock:"Esgotado"}</span></div></div>`).join(""):`<div class="empty" style="grid-column:1/-1">Nenhum produto cadastrado ainda.</div>`;
  $("adm").style.display=isAdmin?"block":"none";
  saveCart();
}
$("chips").onclick=e=>{const b=e.target.closest(".chip");if(b){plat=b.dataset.p;render()}};
$("q").oninput=render;
$("grid").onclick=e=>{const c=e.target.closest(".card");if(c)showP(c.dataset.id)};

function showP(id){
  const p=P.find(x=>x.id===id);if(!p)return;
  const R=(a,b)=>`<div class="row"><span>${a}</span><span>${b?esc(b):"—"}</span></div>`;
  const ch=p.channels||[];
  open($("ovp"),`<div class="sh"><span>Ficha do Produto</span><button class="x" onclick="close('ovp')">✕</button></div>
  <div class="ph" style="aspect-ratio:16/10">${ph(p)}</div>
  <div class="pad"><h2 style="margin:12px 0 2px">${esc(p.name)}</h2><div class="price" style="font-size:24px">${yen(p.price)}</div><div class="stk ${p.stock>0?"":"out"}">${p.stock>0?p.stock+" em estoque":"Esgotado"}</div></div>
  <div class="fs"><h4>✦ IDENTIFICAÇÃO</h4>${R("Nome do jogo",p.name)}${R("Plataforma",p.platform)}${R("Código / ID",p.code)}${isAdmin?R("Valor de compra",yen(p.cost))+R("Data de aquisição",p.buyDate)+R("Local de compra",p.buyPlace):""}${R("Condição",p.condition)}</div>
  <div class="fs"><h4>✦ DETALHES DO PRODUTO</h4>${R("Condição geral",p.general)}${R("Estado do disco/cartucho",p.disc)}${R("Estado da caixa/manual",p.box)}</div>
  <div class="fs"><h4>✦ CANAIS DE VENDA</h4><div class="tags">${CH.map(c=>`<span class="tag ${ch.includes(c)?"on":""}">${ch.includes(c)?"☑":"☐"} ${esc(c)}</span>`).join("")}</div></div>
  <div class="fs"><h4>✦ OBSERVAÇÕES</h4><div style="padding:10px 12px;white-space:pre-wrap">${esc(p.notes)||"—"}</div></div>
  <div class="pad" style="display:flex;gap:8px"><button class="btn" style="flex:1" ${p.stock>0?"":"disabled"} onclick="add('${p.id}')">🛒 Adicionar ao carrinho</button>${isAdmin?`<button class="btn sec" onclick="form('${p.id}')">Editar</button>`:""}</div>`);
}
function add(id){
  const p=P.find(x=>x.id===id);if(!p)return;
  if((cart[id]||0)>=p.stock){toast("Limite do estoque atingido");return}
  cart[id]=(cart[id]||0)+1;saveCart();toast("Adicionado ao carrinho ✓");
}
$("cb").onclick=showCart;
function showCart(){
  const ids=Object.keys(cart).filter(i=>P.find(p=>p.id===i));
  let tot=0;
  const rows=ids.map(i=>{const p=P.find(x=>x.id===i);tot+=p.price*cart[i];return `<div class="cl"><div class="ph">${ph(p)}</div><div class="n"><b>${esc(p.name)}</b><div class="stk">${esc(p.platform)} • ${yen(p.price)}</div></div><div class="qty"><button onclick="chg('${i}',-1)">−</button>${cart[i]}<button onclick="chg('${i}',1)">+</button></div></div>`}).join("");
  open($("ovc"),`<div class="sh"><span>🛒 Carrinho</span><button class="x" onclick="close('ovc')">✕</button></div>${rows||'<div class="empty">Carrinho vazio</div>'}
  ${ids.length?`<div class="pad" style="margin-top:14px"><div style="display:flex;justify-content:space-between;font-size:18px;font-weight:800;margin-bottom:10px"><span>Total</span><span class="price">${yen(tot)}</span></div><button class="btn" style="width:100%" onclick="buy()">Finalizar compra</button></div>`:""}`);
}
function chg(i,d){const p=P.find(x=>x.id===i);const n=(cart[i]||0)+d;if(n<=0)delete cart[i];else if(n>p.stock){toast("Limite do estoque");return}else cart[i]=n;saveCart();showCart()}
async function buy(){
  const items=[];let tot=0;
  try{
    for(const i of Object.keys(cart)){
      const q=cart[i];
      if(local){const p=P.find(x=>x.id===i);if(p.stock<q)throw new Error("Estoque insuficiente: "+p.name);p.stock-=q;items.push({id:i,name:p.name,qty:q,price:p.price});tot+=p.price*q;continue}
      const ref=db.collection("products").doc(i);const s=await ref.get();const d=s.data();
      if(!d||d.stock<q)throw new Error("Estoque insuficiente: "+(d?d.name:i));
      await ref.update({stock:d.stock-q});   // diminui o estoque da ficha
      items.push({id:i,name:d.name,qty:q,price:d.price});tot+=d.price*q;
    }
    if(!local)await db.collection("orders").add({items,total:tot,at:new Date().toISOString()});
    cart={};saveCart();render();
    open($("ovc"),`<div class="sh"><span>Compra realizada</span><button class="x" onclick="close('ovc')">✕</button></div><div class="empty"><div style="font-size:48px">✅</div><b>Obrigado!</b><br>Total ${yen(tot)}<br>O estoque das fichas foi atualizado.</div>`);
  }catch(e){toast(e.message||"Erro ao comprar");if(!local)render()}
}

// ADMIN: cadastro / edição da ficha
$("addb").onclick=()=>form();
function form(id){
  const p=P.find(x=>x.id===id)||{channels:[]};close("ovp");
  const v=k=>esc(p[k]);
  open($("ova"),`<div class="sh"><span>${id?"Editar":"Nova"} ficha</span><button class="x" onclick="close('ova')">✕</button></div>
  <form class="f" id="ff"><label class="w">Foto<input type="file" id="fi" accept="image/*"></label>
  <label class="w">Nome do jogo<input name="name" required value="${v("name")}"></label>
  <label>Plataforma<input name="platform" placeholder="PS2, PS3, Wii…" value="${v("platform")}"></label>
  <label>Código / ID<input name="code" value="${v("code")}"></label>
  <label>Preço de venda (¥)<input name="price" type="number" min="0" required value="${v("price")}"></label>
  <label>Estoque (qtd)<input name="stock" type="number" min="0" required value="${p.stock??1}"></label>
  <label>Valor de compra (¥)<input name="cost" type="number" min="0" value="${v("cost")}"></label>
  <label>Data de aquisição<input name="buyDate" type="date" value="${v("buyDate")}"></label>
  <label class="w">Local de compra<input name="buyPlace" placeholder="Mercari, loja…" value="${v("buyPlace")}"></label>
  <label>Condição<select name="condition">${CONDS.map(c=>`<option ${p.condition===c?"selected":""}>${c}</option>`).join("")}</select></label>
  <label>Condição geral<select name="general">${CONDS.map(c=>`<option ${p.general===c?"selected":""}>${c}</option>`).join("")}</select></label>
  <label class="w">Estado do disco/cartucho<input name="disc" placeholder="sem riscos, testado…" value="${v("disc")}"></label>
  <label class="w">Estado da caixa/manual<input name="box" placeholder="caixa com marcas…" value="${v("box")}"></label>
  <div class="w" style="font-size:12px;color:var(--mut)">Canais de venda<div class="tags" style="padding:6px 0">${CH.map(c=>`<label class="tag"><input type="checkbox" name="ch" value="${esc(c)}" ${(p.channels||[]).includes(c)?"checked":""}> ${esc(c)}</label>`).join("")}</div></div>
  <label class="w">Observações<textarea name="notes" rows="3">${v("notes")}</textarea></label>
  <button class="btn w" type="submit">Salvar ficha</button>
  ${id?`<button class="btn sec w" type="button" onclick="del('${id}')">Excluir</button>`:""}</form>`);
  $("ff").onsubmit=async e=>{
    e.preventDefault();const f=new FormData(e.target),d={};
    ["name","platform","code","buyDate","buyPlace","condition","general","disc","box","notes"].forEach(k=>d[k]=f.get(k)||"");
    ["price","stock","cost"].forEach(k=>d[k]=Number(f.get(k))||0);
    d.channels=f.getAll("ch");d.img=p.img||"";
    const file=$("fi").files[0];if(file)d.img=await shrink(file);
    try{
      if(local){if(id)Object.assign(p,d);else P.push({...d,id:"l"+Date.now()});render()}
      else if(id)await db.collection("products").doc(id).set(d);else await db.collection("products").add(d);
      close("ova");toast("Ficha salva ✓");
    }catch(er){toast("Erro ao salvar")}
  };
}
async function del(id){if(!confirm("Excluir esta ficha?"))return;try{if(local)P=P.filter(x=>x.id!==id);else await db.collection("products").doc(id).delete();close("ova");render()}catch(e){toast("Erro")}}
function shrink(file){return new Promise(r=>{const im=new Image();im.onload=()=>{const s=Math.min(1,480/Math.max(im.width,im.height)),c=document.createElement("canvas");c.width=im.width*s;c.height=im.height*s;c.getContext("2d").drawImage(im,0,0,c.width,c.height);r(c.toDataURL("image/jpeg",.75))};im.src=URL.createObjectURL(file)})}

// INICIALIZAÇÃO — banco local (banco.js). Admin: abra o site com #admin no final do endereço
(function(){
  db=window.BancoDB;isAdmin=location.hash==="#admin";
  window.addEventListener("hashchange",()=>location.reload());
  db.collection("products").onSnapshot(s=>{P=s.docs.map(d=>({id:d.id,...d.data()}));render()});
  render();
})();