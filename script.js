const WA_PHONE = "5521987911068"; 

const database = [
    { id: 1, cat: 'Remédios', nome: 'Dipirona Sódica 500mg', old: 14.90, price: 8.90 },
    { id: 2, cat: 'Remédios', nome: 'Dorflex 36 Comprimidos', old: 28.50, price: 19.90 },
    { id: 3, cat: 'Remédios', nome: 'Paracetamol 750mg', old: 18.00, price: 11.50 },
    { id: 4, cat: 'Remédios', nome: 'Ibuprofeno 600mg', old: 24.00, price: 14.90 },
    { id: 5, cat: 'Remédios', nome: 'Antigripal MultiSint', old: 19.00, price: 12.00 },
    { id: 6, cat: 'Remédios', nome: 'Xarope Vick 120ml', old: 34.00, price: 26.00 },
    { id: 7, cat: 'Remédios', nome: 'Aspirina 500mg 10un', old: 12.00, price: 9.00 },
    { id: 8, cat: 'Cosméticos', nome: 'Protetor Solar FPS 60', old: 85.00, price: 59.90 },
    { id: 9, cat: 'Cosméticos', nome: 'Hidratante Neutrogena', old: 55.00, price: 39.00 },
    { id: 10, cat: 'Cosméticos', nome: 'Sérum Vitamina C 30ml', old: 110.00, price: 79.90 },
    { id: 11, cat: 'Cosméticos', nome: 'Água Micelar 200ml', old: 35.00, price: 22.00 },
    { id: 12, cat: 'Cosméticos', nome: 'Gel de Limpeza Facial', old: 48.00, price: 34.00 },
    { id: 13, cat: 'Cosméticos', nome: 'Shampoo Antiqueda', old: 59.00, price: 42.00 },
    { id: 14, cat: 'Cosméticos', nome: 'Creme Antirrugas Noite', old: 125.00, price: 88.00 },
    { id: 15, cat: 'Higiene', nome: 'Sabonete Líquido Protex', old: 18.00, price: 12.90 },
    { id: 16, cat: 'Higiene', nome: 'Creme Dental Pack 3un', old: 19.00, price: 13.50 },
    { id: 17, cat: 'Higiene', nome: 'Desodorante Rexona Pack', old: 32.00, price: 24.00 },
    { id: 18, cat: 'Higiene', nome: 'Fio Dental 50m 2un', old: 15.00, price: 9.90 },
    { id: 19, cat: 'Higiene', nome: 'Enxaguante Bucal 500ml', old: 26.00, price: 18.00 },
    { id: 20, cat: 'Higiene', nome: 'Papel Higiênico 12un', old: 24.00, price: 17.50 },
    { id: 21, cat: 'Higiene', nome: 'Escova de Dente Macia', old: 15.00, price: 8.00 },
    { id: 22, cat: 'Vitaminas', nome: 'Vitamina C Efervescente', old: 28.00, price: 18.00 },
    { id: 23, cat: 'Vitaminas', nome: 'Multivitamínico A-Z', old: 80.00, price: 49.90 },
    { id: 24, cat: 'Vitaminas', nome: 'Ômega 3 1000mg', old: 95.00, price: 65.00 },
    { id: 25, cat: 'Vitaminas', nome: 'Colágeno Hidrolisado', old: 115.00, price: 82.00 },
    { id: 26, cat: 'Vitaminas', nome: 'Magnésio Dimalato', old: 55.00, price: 38.00 },
    { id: 27, cat: 'Vitaminas', nome: 'Vitamina D 2000UI', old: 42.00, price: 29.00 },
    { id: 28, cat: 'Vitaminas', nome: 'Biotina Cabelos e Unhas', old: 65.00, price: 44.00 }
];

let cart = [];

function init() {
    const shop = document.getElementById('shop');
    const categories = [...new Set(database.map(p => p.cat))];
    let html = '';

    categories.forEach(cat => {
        html += `
            <div class="category-section">
                <div class="category-header">
                    <h2 class="category-title">${cat}</h2>
                    <span class="drag-hint">Arraste para o lado ➔</span>
                </div>
                <div class="product-row">
                    ${database.filter(p => p.cat === cat).map(p => `
                        <div class="product-card" data-name="${p.nome.toLowerCase()}">
                            <div class="img-placeholder"></div>
                            <p class="prod-name">${p.nome}</p>
                            <span class="price-old">R$ ${p.old.toFixed(2)}</span>
                            <span class="price-now">R$ ${p.price.toFixed(2)}</span>
                            <button class="btn-add" onclick="addToCart(${p.id}, this)">ADICIONAR</button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    });
    shop.innerHTML = html;
}

function addToCart(id, btn) {
    const item = database.find(p => p.id === id);
    const inCart = cart.find(p => p.id === id);
    if (inCart) inCart.qtd++; else cart.push({...item, qtd: 1});

    btn.innerText = "ADICIONADO ✅";
    btn.style.background = "#2ecc71";
    setTimeout(() => {
        btn.innerText = "ADICIONAR";
        btn.style.background = "#003b95";
    }, 800);

    updateUI();
}

function updateUI() {
    const totalCount = cart.reduce((a, b) => a + b.qtd, 0);
    const totalPrice = cart.reduce((a, b) => a + (b.price * b.qtd), 0);
    document.getElementById('cart-count').innerText = totalCount;
    document.getElementById('total-price').innerText = `R$ ${totalPrice.toFixed(2).replace('.', ',')}`;
    
    document.getElementById('cart-items').innerHTML = cart.map(i => `
        <div class="cart-item">
            <div><strong>${i.nome}</strong><br><small>${i.qtd}x R$ ${i.price.toFixed(2)}</small></div>
            <button onclick="remove(${i.id})" style="border:none;background:none;color:red;cursor:pointer">Remover</button>
        </div>
    `).join('');
}

function remove(id) {
    cart = cart.filter(i => i.id !== id);
    updateUI();
}

function openCart() { document.getElementById('cart-modal').style.display = 'flex'; }
function closeCart() { document.getElementById('cart-modal').style.display = 'none'; }

function toggleTroco() {
    const p = document.getElementById('pagamento').value;
    document.getElementById('troco').style.display = (p === 'Dinheiro') ? 'block' : 'none';
}

function sendWhatsApp() {
    const nome = document.getElementById('nome').value;
    const end = document.getElementById('endereco').value;
    const pag = document.getElementById('pagamento').value;
    const troco = document.getElementById('troco').value;

    if (!nome || !end || !pag) return alert("Preencha os dados de entrega.");
    if (cart.length === 0) return alert("Carrinho vazio!");

    let text = `*NOVO PEDIDO - FARMAPRO*%0A%0A`;
    text += `*Cliente:* ${nome}%0A*Endereço:* ${end}%0A*Pagamento:* ${pag}%0A`;
    if(pag === 'Dinheiro' && troco) text += `*Troco para:* ${troco}%0A`;
    text += `%0A*PRODUTOS:*%0A`;
    cart.forEach(i => text += `- ${i.qtd}x ${i.nome}%0A`);
    text += `%0A*TOTAL: ${document.getElementById('total-price').innerText}*`;

    window.open(`https://wa.me/${WA_PHONE}?text=${text}`);
}

// OTIMIZADO PARA NÃO CAUSAR LAG
function filterProducts() {
    const term = document.getElementById('searchInput').value.toLowerCase();
    const cards = document.querySelectorAll('.product-card');
    
    // Usando hidden em vez de display: none para preservar o layout do carrossel se necessário
    cards.forEach(card => {
        const shouldShow = card.getAttribute('data-name').includes(term);
        card.style.display = shouldShow ? 'flex' : 'none';
    });
}

document.addEventListener('DOMContentLoaded', init);