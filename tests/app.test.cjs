const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function createApp() {
  class Element {
    constructor() { this.listeners = {}; this.textContent = ''; this.innerHTML = ''; this.disabled = false; }
    addEventListener(type, handler) { this.listeners[type] = handler; }
    click(event) { this.listeners.click(event); }
  }
  const categoryNames = ['全部', '純茶', '奶茶', '果茶'];
  const categories = categoryNames.map(name => ({
    dataset: { category: name },
    classList: { toggle() {} },
    setAttribute(name, value) { if (name === 'aria-pressed') this.ariaPressed = value; }
  }));
  const elements = new Map();
  for (const selector of ['.category-tabs', '#drink-grid', '#cart-items', '#checkout', '#header-count', '#cart-label', '#cart-total', '#checkout-note']) {
    elements.set(selector, new Element());
  }
  const document = {
    querySelector(selector) { return elements.get(selector); },
    querySelectorAll(selector) { return selector === '.category' ? categories : []; }
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8'), { document });

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
  const changeQuantity = (key, change) => {
    const button = { dataset: { quantity: key, change: String(change) } };
    elements.get('#cart-items').click({ target: { closest: selector => selector === '[data-quantity]' ? button : null } });
  };
  const remove = key => {
    const button = { dataset: { remove: key } };
    elements.get('#cart-items').click({ target: { closest: selector => selector === '[data-remove]' ? button : null } });
  };
  return { elements, add, category, changeQuantity, remove, categories };
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
