const token = localStorage.getItem('wms_token');
if(!token && location.pathname !== '/index.html' && location.pathname !== '/') {
  location.href = '/';
}

document.getElementById('btnLogout')?.addEventListener('click', ()=>{
  localStorage.removeItem('wms_token');
  location.href = '/';
});

const modalEl = document.getElementById('itemModal');
const bsModal = new bootstrap.Modal(modalEl);

async function api(path, opts={}){
  opts.headers = opts.headers || {};
  opts.headers['Content-Type'] = 'application/json';
  if(localStorage.getItem('wms_token')) opts.headers['Authorization'] = 'Bearer ' + localStorage.getItem('wms_token');
  const res = await fetch('/api' + path, opts);
  const data = await res.json().catch(()=> ({}));
  if(!res.ok) throw data;
  return data;
}

async function loadItems(){
  try{
    const items = await api('/items');
    const tbody = document.querySelector('#itemsTable tbody');
    tbody.innerHTML = '';
    items.forEach(i=>{
      const tr = document.createElement('tr');
      if(i.quantity <= 5) tr.classList.add('low-stock');
      tr.innerHTML = `<td>${i.name}</td><td>${i.quantity}</td><td>${i.location||''}</td><td>${i.expiry||''}</td>
        <td>
          <button class="btn btn-sm btn-primary btn-edit" data-id="${i.id}">Edit</button>
          <button class="btn btn-sm btn-danger btn-del" data-id="${i.id}">Delete</button>
        </td>`;
      tbody.appendChild(tr);
    });

    document.querySelectorAll('.btn-edit').forEach(b=>{
      b.addEventListener('click', async (e)=>{
        const id = e.target.dataset.id;
        const items = await api('/items');
        const it = items.find(x=>x.id===id);
        document.getElementById('itemId').value = it.id;
        document.getElementById('itemName').value = it.name;
        document.getElementById('itemQty').value = it.quantity;
        document.getElementById('itemLoc').value = it.location;
        document.getElementById('itemExpiry').value = it.expiry || '';
        document.getElementById('modalTitle').innerText = 'Edit Item';
        bsModal.show();
      });
    });

    document.querySelectorAll('.btn-del').forEach(b=>{
      b.addEventListener('click', async (e)=>{
        if(!confirm('Delete this item?')) return;
        const id = e.target.dataset.id;
        await api('/items/' + id, { method:'DELETE' });
        loadItems();
      });
    });

  }catch(err){
    console.error(err);
    document.getElementById('alerts').innerHTML = '<div class="alert alert-danger">Failed to load items</div>';
  }
}

document.getElementById('btnAdd')?.addEventListener('click', ()=>{
  document.getElementById('itemForm').reset();
  document.getElementById('itemId').value = '';
  document.getElementById('modalTitle').innerText = 'Add Item';
  bsModal.show();
});

document.getElementById('itemForm')?.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const id = document.getElementById('itemId').value;
  const payload = {
    name: document.getElementById('itemName').value,
    quantity: Number(document.getElementById('itemQty').value),
    location: document.getElementById('itemLoc').value,
    expiry: document.getElementById('itemExpiry').value || null
  };
  try{
    if(id){
      await api('/items/' + id, { method:'PUT', body: JSON.stringify(payload) });
    } else {
      await api('/items', { method:'POST', body: JSON.stringify(payload) });
    }
    bsModal.hide();
    loadItems();
  }catch(err){
    alert(err.message || 'Error');
  }
});

if(document.querySelector('#itemsTable')) loadItems();
