const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function createApp(storage = new Map()) {
  class Element {
    constructor() { this.listeners = {}; this.textContent = ''; this.innerHTML = ''; this.disabled = false; }
    addEventListener(type, handler) { this.listeners[type] = handler; }
    click(event) { this.listeners.click(event); }
  }
  const categoryNames = ['全部', '純茶', '奶茶', '果茶', '收藏'];
  const categories = categoryNames.map(name => ({
    dataset: { category: name },
    classList: { toggle() {} },
    setAttribute(name, value) { if (name === 'aria-pressed') this.ariaPressed = value; }
  }));
  const elements = new Map();
  for (const selector of ['.category-tabs', '#drink-grid', '#menu-search', '#menu-sort', '#cart-items', '#checkout', '#header-count', '#cart-label', '#cart-total', '#checkout-note', '#order-history-items']) {
    elements.set(selector, new Element());
  }
  const document = {
    querySelector(selector) { return elements.get(selector); },
    querySelectorAll(selector) { return selector === '.category' ? categories : []; }
  };
  const localStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8'), { document, localStorage });

  const add = (id, options = {}) => {
    const card = {
      querySelector(selector) {
        if (selector === '.sugar') return { value: options.sugar ?? '正常糖' };
        if (selector === '.ice') return { value: options.ice ?? '正常冰' };
        if (selector === '.size') return { value: options.size ?? '中杯' };
        if (selector === '.topping') {
          const topping = options.topping ?? '不加配料';
          const price = topping === '奶蓋' ? 15 : topping === '不加配料' ? 0 : 10;
          return { selectedOptions: [{ value: topping, dataset: { price: String(price) } }] };
        }
      }
    };
    const button = { dataset: { add: id }, closest: () => card };
    elements.get('#drink-grid').click({ target: { closest: selector => selector === '[data-add]' ? button : null } });
  };
  const category = name => {
    const button = categories.find(item => item.dataset.category === name);
    elements.get('.category-tabs').click({ target: { closest: selector => selector === '[data-category]' ? button : null } });
  };
  const search = value => elements.get('#menu-search').listeners.input({ target: { value } });
  const sort = value => elements.get('#menu-sort').listeners.change({ target: { value } });
  const changeQuantity = (key, change) => {
    const button = { dataset: { quantity: key, change: String(change) } };
    elements.get('#cart-items').click({ target: { closest: selector => selector === '[data-quantity]' ? button : null } });
  };
  const remove = key => {
    const button = { dataset: { remove: key } };
    elements.get('#cart-items').click({ target: { closest: selector => selector === '[data-remove]' ? button : null } });
  };
  const reorder = index => {
    const button = { dataset: { reorder: String(index) } };
    elements.get('#order-history-items').click({ target: { closest: selector => selector === '[data-reorder]' ? button : null } });
  };
  const favorite = id => {
    const button = { dataset: { favorite: id } };
    elements.get('#drink-grid').click({ target: { closest: selector => selector === '[data-favorite]' ? button : null } });
  };
  return { elements, add, category, search, sort, changeQuantity, remove, reorder, favorite, categories, storage };
}

test('菜單分類會顯示對應飲品', () => {
  const app = createApp();
  const grid = app.elements.get('#drink-grid');
  assert.equal((grid.innerHTML.match(/class="drink-card"/g) || []).length, 6);
  app.category('奶茶');
  assert.equal((grid.innerHTML.match(/class="drink-card"/g) || []).length, 2);
  assert.match(grid.innerHTML, /日月奶茶/);
  assert.match(grid.innerHTML, /小山抹茶拿鐵/);
  assert.match(grid.innerHTML, /aria-label="將 日月奶茶 加入購物車"/);
  assert.equal(app.categories.find(item => item.dataset.category === '奶茶').ariaPressed, 'true');
  assert.equal(app.categories.find(item => item.dataset.category === '全部').ariaPressed, 'false');
  assert.doesNotMatch(grid.innerHTML, /焙香烏龍/);
});

test('菜單可依飲品名稱、風味與分類搜尋，並顯示無結果提示', () => {
  const app = createApp();
  app.search('柚子');
  assert.match(app.elements.get('#drink-grid').innerHTML, /柚香青茶/);
  assert.doesNotMatch(app.elements.get('#drink-grid').innerHTML, /莓好果茶/);
  app.search('不存在的飲料');
  assert.match(app.elements.get('#drink-grid').innerHTML, /找不到符合的飲品/);
});

test('菜單可依價格升降排序，並保留分類和搜尋篩選', () => {
  const app = createApp();
  app.sort('price-low');
  const lowToHigh = app.elements.get('#drink-grid').innerHTML;
  assert.ok(lowToHigh.indexOf('data-id="jasmine"') < lowToHigh.indexOf('data-id="oolong"'));
  assert.ok(lowToHigh.indexOf('data-id="oolong"') < lowToHigh.indexOf('data-id="milk"'));
  app.sort('price-high');
  const highToLow = app.elements.get('#drink-grid').innerHTML;
  assert.ok(highToLow.indexOf('data-id="matcha"') < highToLow.indexOf('data-id="fruit"'));
  app.category('果茶');
  app.search('莓果');
  assert.match(app.elements.get('#drink-grid').innerHTML, /data-id="berry"/);
  assert.doesNotMatch(app.elements.get('#drink-grid').innerHTML, /data-id="fruit"/);
});

test('收藏飲品會保存，並可用收藏分類快速篩選', () => {
  const storage = new Map();
  const first = createApp(storage);
  first.favorite('milk');
  assert.match(first.elements.get('#drink-grid').innerHTML, /aria-pressed="true"/);
  const restored = createApp(storage);
  restored.category('收藏');
  const grid = restored.elements.get('#drink-grid').innerHTML;
  assert.match(grid, /日月奶茶/);
  assert.doesNotMatch(grid, /茉香綠茶/);
  restored.favorite('milk');
  assert.match(restored.elements.get('#drink-grid').innerHTML, /找不到符合的飲品/);
  assert.deepEqual(JSON.parse(storage.get('qiri-tea-shop-favorites')), []);
});

test('購物車重新載入後保留，結帳後清除已保存內容', () => {
  const storage = new Map();
  const first = createApp(storage);
  first.add('milk', { size: '大杯' });
  const restored = createApp(storage);
  assert.equal(restored.elements.get('#header-count').textContent, 1);
  assert.equal(restored.elements.get('#cart-total').textContent, '$65');
  restored.elements.get('#checkout').click();
  assert.equal(JSON.parse(storage.get('qiri-tea-shop-cart')).length, 0);
});

test('客製飲品合併同選項、正確計價並支援數量和移除', () => {
  const app = createApp();
  app.add('jasmine');
  app.add('jasmine');
  app.add('jasmine', { size: '大杯', topping: '珍珠' });

  const headerCount = app.elements.get('#header-count');
  const total = app.elements.get('#cart-total');
  const rows = app.elements.get('#cart-items');
  const regularKey = 'jasmine|正常糖|正常冰|中杯|不加配料';
  const customKey = 'jasmine|正常糖|正常冰|大杯|珍珠';
  assert.equal(headerCount.textContent, 3);
  assert.equal(total.textContent, '$125');
  assert.match(rows.innerHTML, /\$70/);
  assert.match(rows.innerHTML, /\$55/);
  assert.match(rows.innerHTML, /茉香綠茶 增加數量/);
  assert.match(rows.innerHTML, /茉香綠茶 移除品項/);

  app.changeQuantity(regularKey, -1);
  assert.equal(headerCount.textContent, 2);
  assert.equal(total.textContent, '$90');
  app.remove(customKey);
  assert.equal(headerCount.textContent, 1);
  assert.equal(total.textContent, '$35');
});

test('確認點單後顯示摘要並清空購物車', () => {
  const app = createApp();
  const checkout = app.elements.get('#checkout');
  app.add('milk', { size: '大杯', topping: '奶蓋' });
  assert.equal(checkout.disabled, false);
  checkout.click();
  assert.equal(app.elements.get('#header-count').textContent, 0);
  assert.equal(app.elements.get('#cart-total').textContent, '$0');
  assert.equal(checkout.disabled, true);
  assert.match(app.elements.get('#checkout-note').textContent, /共 1 杯，合計 \$80/);
});

test('完成訂單會保存品項摘要並在重新載入後顯示', () => {
  const storage = new Map();
  const first = createApp(storage);
  first.add('milk', { size: '大杯', topping: '珍珠' });
  first.elements.get('#checkout').click();
  const restored = createApp(storage);
  const history = restored.elements.get('#order-history-items').innerHTML;
  assert.match(history, /日月奶茶/);
  assert.match(history, /大杯 × 1/);
  assert.match(history, /\$75/);
  assert.match(history, /再點一次/);
  restored.add('milk', { size: '大杯', topping: '珍珠' });
  restored.reorder(0);
  assert.equal(restored.elements.get('#header-count').textContent, 2);
  assert.equal(restored.elements.get('#cart-total').textContent, '$150');
  assert.match(restored.elements.get('#cart-items').innerHTML, /日月奶茶・大杯/);
});
