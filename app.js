const drinks = [
  {id:'jasmine',name:'茉香綠茶',category:'純茶',description:'清新茉莉 × 一抹茶香',price:35,tea:'#adb58a',orb:'#e0e5d5',tag:'清爽推薦'},
  {id:'oolong',name:'焙香烏龍',category:'純茶',description:'慢火焙香 × 醇厚回甘',price:40,tea:'#a66f48',orb:'#eadbca',tag:'人氣經典'},
  {id:'milk',name:'日月奶茶',category:'奶茶',description:'濃醇鮮奶 × 錫蘭紅茶',price:55,tea:'#c89a6c',orb:'#ecdfca',tag:'店長推薦'},
  {id:'matcha',name:'小山抹茶拿鐵',category:'奶茶',description:'靜岡抹茶 × 鮮乳香氣',price:65,tea:'#839567',orb:'#dce3ce',tag:'限定風味'},
  {id:'fruit',name:'柚香青茶',category:'果茶',description:'蜜漬柚子 × 四季青茶',price:60,tea:'#c1b36b',orb:'#ece6c9',tag:'微酸果香'},
  {id:'berry',name:'莓好果茶',category:'果茶',description:'莓果果粒 × 清爽紅茶',price:65,tea:'#b97669',orb:'#ecd8d3',tag:'酸甜剛好'}
];
const sugarOptions=['正常糖','少糖','半糖','微糖','無糖'];
const iceOptions=['正常冰','少冰','微冰','去冰','熱飲'];
const toppingOptions=[{name:'不加配料',price:0},{name:'珍珠',price:10},{name:'椰果',price:10},{name:'茶凍',price:10},{name:'奶蓋',price:15}];
let cart=[];
let activeCategory='全部';
const money=value=>`$${value}`;
function renderMenu(){
  const visible=activeCategory==='全部'?drinks:drinks.filter(drink=>drink.category===activeCategory);
  document.querySelector('#drink-grid').innerHTML=visible.map(drink=>`<article class="drink-card" data-id="${drink.id}">
    <div class="drink-visual" style="--orb:${drink.orb};--tea:${drink.tea}"><span class="drink-tag">${drink.tag}</span><div class="mini-cup"></div><span class="mini-straw"></span></div>
    <div class="drink-info"><div><h3>${drink.name}</h3><p>${drink.description}</p></div><span class="price">${money(drink.price)}</span></div>
    <div class="customize"><label>甜度<select class="sugar">${sugarOptions.map(value=>`<option>${value}</option>`).join('')}</select></label>
    <label>冰塊<select class="ice">${iceOptions.map(value=>`<option>${value}</option>`).join('')}</select></label>
    <label>杯型<select class="size"><option value="中杯">中杯　+$0</option><option value="大杯">大杯　+$10</option></select></label>
    <label>配料<select class="topping">${toppingOptions.map(item=>`<option value="${item.name}" data-price="${item.price}">${item.name}${item.price?`　+$${item.price}`:''}</option>`).join('')}</select></label></div>
    <button class="add-button" data-add="${drink.id}">加入購物車 <span>＋</span></button></article>`).join('');
}
function renderCart(){
  const totalCount=cart.reduce((sum,item)=>sum+item.quantity,0);
  const total=cart.reduce((sum,item)=>sum+item.unitPrice*item.quantity,0);
  document.querySelector('#header-count').textContent=totalCount;
  document.querySelector('#cart-label').textContent=`${totalCount} 杯飲料`;
  document.querySelector('#cart-total').textContent=money(total);
  document.querySelector('#checkout').disabled=cart.length===0;
  const area=document.querySelector('#cart-items');
  if(!cart.length){area.innerHTML='<div class="empty-cart"><span>☕</span><p>購物車還空空的</p><small>先挑一杯喜歡的茶吧</small></div>';return;}
  area.innerHTML=cart.map(item=>`<div class="cart-row"><div><span class="cart-item-name">${item.name}・${item.size}</span><span class="cart-item-detail">${item.sugar} / ${item.ice} / ${item.topping}</span></div><span class="cart-item-price">${money(item.unitPrice*item.quantity)}</span><div class="quantity-control"><button data-quantity="${item.key}" data-change="-1" aria-label="減少數量">−</button><span>${item.quantity}</span><button data-quantity="${item.key}" data-change="1" aria-label="增加數量">＋</button><button class="remove-button" data-remove="${item.key}" aria-label="移除品項">×</button></div></div>`).join('');
}
document.querySelector('.category-tabs').addEventListener('click',event=>{const button=event.target.closest('[data-category]');if(!button)return;activeCategory=button.dataset.category;document.querySelectorAll('.category').forEach(item=>item.classList.toggle('active',item===button));renderMenu();});
document.querySelector('#drink-grid').addEventListener('click',event=>{
  const button=event.target.closest('[data-add]');if(!button)return;
  const card=button.closest('.drink-card');const drink=drinks.find(item=>item.id===button.dataset.add);
  const topping=card.querySelector('.topping').selectedOptions[0];const size=card.querySelector('.size');
  const options={sugar:card.querySelector('.sugar').value,ice:card.querySelector('.ice').value,size:size.value,topping:topping.value};
  const unitPrice=drink.price+(size.value==='大杯'?10:0)+Number(topping.dataset.price);
  const key=[drink.id,...Object.values(options)].join('|');const existing=cart.find(item=>item.key===key);
  if(existing)existing.quantity++;else cart.push({key,name:drink.name,...options,unitPrice,quantity:1});
  document.querySelector('#checkout-note').textContent=`已將「${drink.name}」加入購物車`;
  renderCart();
});
document.querySelector('#cart-items').addEventListener('click',event=>{
  const quantity=event.target.closest('[data-quantity]');const remove=event.target.closest('[data-remove]');
  if(quantity){const item=cart.find(row=>row.key===quantity.dataset.quantity);item.quantity+=Number(quantity.dataset.change);if(item.quantity<=0)cart=cart.filter(row=>row!==item);}
  if(remove)cart=cart.filter(row=>row.key!==remove.dataset.remove);
  renderCart();
});
document.querySelector('#checkout').addEventListener('click',()=>{
  if(!cart.length)return;
  const count=cart.reduce((sum,item)=>sum+item.quantity,0);const total=cart.reduce((sum,item)=>sum+item.quantity*item.unitPrice,0);
  cart=[];renderCart();document.querySelector('#checkout-note').textContent=`點單完成！共 ${count} 杯，合計 ${money(total)}。謝謝你來沏日 ☺`;
});
renderMenu();renderCart();
