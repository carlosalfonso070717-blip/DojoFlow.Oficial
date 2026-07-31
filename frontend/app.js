// ==========================================
// SEGURIDAD: VERIFICACIÓN DE TOKEN
// ==========================================
const tokenCoach = localStorage.getItem('coachToken');

// Si no hay token guardado, lo regresamos a la pantalla de Login
if (!tokenCoach) {
    window.location.href = 'login.html';
}

// Función auxiliar para inyectar el Token en TODAS las peticiones
function obtenerHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenCoach}` // Aquí mostramos el gafete VIP
    };
}

// ==========================================
// CERRAR SESIÓN
// ==========================================
const btnCerrarSesion = document.getElementById('btnCerrarSesion');
if (btnCerrarSesion) {
    btnCerrarSesion.addEventListener('click', () => {
        Swal.fire({
            title: '¿Cerrar sesión?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, salir',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#d90429'
        }).then((resultado) => {
            if (resultado.isConfirmed) {
                localStorage.removeItem('coachToken');
                window.location.href = 'login.html';
            }
        });
    });
}

// ==========================================
// TEMA CLARO / OSCURO
// ==========================================
const btnTema = document.getElementById('btnTema');
if (btnTema) {
    btnTema.addEventListener('click', () => {
        const actual = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
        const nuevo = actual === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', nuevo);
        document.documentElement.setAttribute('data-bs-theme', nuevo);
        localStorage.setItem('dojoflow-theme', nuevo);
    });
}

// ==========================================
// CONFIGURACIÓN GENERAL
// ==========================================
const API_URL = "/api";

// CACHÉS LOCALES
let cacheAlumnos = [];
let cacheMensualidades = [];
let cacheInventario = []; 
let cacheFinanzas = [];

// Configuración de Alertas SweetAlert
const Toast = Swal.mixin({
    toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true
});

// ==========================================
// LÓGICA DE NAVEGACIÓN Y MENÚ LATERAL
// ==========================================
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const btnToggleMenu = document.getElementById('btnToggleMenu');

function toggleSidebar() {
    sidebar.classList.toggle('show');
    sidebarOverlay.classList.toggle('show');
}
if(btnToggleMenu) btnToggleMenu.addEventListener('click', toggleSidebar);
if(sidebarOverlay) sidebarOverlay.addEventListener('click', toggleSidebar);

const vistas = {
    'nav-registro': { id: 'vista-registro', title: 'Nuevo Registro' },
    'nav-lista': { id: 'vista-lista', title: 'Gestión de Alumnos', action: cargarAlumnos },
    'nav-mensualidades': { id: 'vista-mensualidades', title: 'Administración Financiera', action: cargarMensualidades },
    'nav-inventario': { id: 'vista-inventario', title: 'Control de Inventario', action: cargarInventario },
    'nav-finanzas': { id: 'vista-finanzas', title: 'Reportes y Finanzas', action: cargarFinanzas }
};

document.querySelectorAll('.sidebar a').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const idNav = e.currentTarget.id;
        
        document.querySelectorAll('.sidebar a').forEach(a => a.classList.remove('active'));
        document.querySelectorAll('.col-md-10 .card').forEach(c => c.classList.add('d-none'));
        
        e.currentTarget.classList.add('active');
        const vistaAMostrar = document.getElementById(vistas[idNav].id);
        if(vistaAMostrar) vistaAMostrar.classList.remove('d-none');
        
        document.getElementById('page-title').innerText = vistas[idNav].title;
        
        if(window.innerWidth < 768) toggleSidebar();
        
        if (vistas[idNav].action) vistas[idNav].action();
    });
});

// ==========================================
// MÓDULO 1: ALUMNOS
// ==========================================
const formRegistro = document.getElementById('registroForm');
if(formRegistro){
    formRegistro.addEventListener('submit', async (e) => {
        e.preventDefault();
        const disciplinas = Array.from(document.querySelectorAll('.disciplina-check:checked')).map(cb => cb.value);
        if (disciplinas.length === 0) return Swal.fire('Error', 'Selecciona al menos una disciplina', 'error');

        const data = { nombre: document.getElementById('nombre').value, apellido: document.getElementById('apellido').value, telefono: document.getElementById('telefono').value, disciplinas };
        
        try {
            const res = await fetch(`${API_URL}/Alumnos`, { 
                method: 'POST', 
                headers: obtenerHeaders(), // <-- Token agregado
                body: JSON.stringify(data) 
            });
            const result = await res.json();
            
            if (res.ok) {
                Swal.fire({
                    icon: 'success', title: 'Peleador Registrado',
                    html: `Nombre: <b>${result.nombreCompleto}</b><br>PIN de Acceso: <b style="font-size:20px; color:#d90429;">${result.claveKioscoAsignada}</b><br>Cuota: $${result.costoMensualidadAsignado}`,
                    confirmButtonColor: '#d90429'
                });
                document.getElementById('registroForm').reset();
            } else throw new Error(result.error);
        } catch (err) { Swal.fire('Error', err.message || 'Falla de conexión', 'error'); }
    });
}

async function cargarAlumnos() {
    try {
        const res = await fetch(`${API_URL}/Alumnos`, { headers: obtenerHeaders() }); // <-- Token agregado
        if (res.status === 401) throw new Error("Sesión expirada");
        cacheAlumnos = await res.json();
        renderizarTablaAlumnos(cacheAlumnos);
    } catch (e) { 
        console.log(e); 
        if (e.message === "Sesión expirada") window.location.href = 'login.html';
    }
}

const buscadorAlumnos = document.getElementById('buscador-alumnos');
if(buscadorAlumnos){
    buscadorAlumnos.addEventListener('input', (e) => {
        renderizarTablaAlumnos(cacheAlumnos.filter(a => a.nombre.toLowerCase().includes(e.target.value.toLowerCase())));
    });
}

function renderizarTablaAlumnos(lista) {
    const tabla = document.getElementById('tabla-alumnos');
    if(!tabla) return;
    tabla.innerHTML = lista.map(a => `
        <tr>
            <td class="fw-bold">
                <div class="d-flex align-items-center gap-3">
                    <div class="bg-light text-dark rounded-circle d-flex align-items-center justify-content-center" style="width:40px; height:40px; font-weight:bold;">${a.nombre.charAt(0)}</div>
                    ${a.nombre}
                </div>
            </td>
            <td class="text-muted">${a.telefono}</td>
            <td><span class="badge bg-secondary font-monospace" style="font-size: 14px;">${a.claveKiosco}</span></td>
            <td>${a.disciplinas.map(d => `<span class="badge bg-danger me-1 mb-1">${d}</span>`).join('')}</td>
            <td class="text-success fw-bold">$${a.costoMensualidad.toFixed(2)}</td>
            <td><button class="btn btn-sm btn-light border text-danger" onclick="eliminarAlumno('${a.id}')" title="Dar de baja"><i class="fa-solid fa-trash"></i></button></td>
        </tr>
    `).join('');
}

function eliminarAlumno(id) {
    Swal.fire({
        title: '¿Dar de baja?', text: 'Se eliminarán sus recibos.', icon: 'warning', showCancelButton: true, confirmButtonColor: '#d90429', confirmButtonText: 'Sí, eliminar'
    }).then(async (result) => {
        if (result.isConfirmed) {
            await fetch(`${API_URL}/Alumnos/${id}`, { method: "DELETE", headers: obtenerHeaders() }); // <-- Token agregado
            Toast.fire({ icon: 'success', title: 'Alumno eliminado' });
            cargarAlumnos();
        }
    });
}

// ==========================================
// MÓDULO 2: MENSUALIDADES
// ==========================================
async function cargarMensualidades() {
    const res = await fetch(`${API_URL}/Mensualidades`, { headers: obtenerHeaders() }); // <-- Token agregado
    cacheMensualidades = await res.json();
    renderizarTablaMensualidades(cacheMensualidades);
}

const buscadorMensualidades = document.getElementById('buscador-mensualidades');
if(buscadorMensualidades){
    buscadorMensualidades.addEventListener('input', (e) => {
        const val = e.target.value.toLowerCase();
        renderizarTablaMensualidades(cacheMensualidades.filter(m => m.nombreAlumno.toLowerCase().includes(val) || m.claveKiosco.toLowerCase().includes(val)));
    });
}

function renderizarTablaMensualidades(lista) {
    const tabla = document.getElementById('tabla-mensualidades-body');
    if(!tabla) return;
    tabla.innerHTML = lista.map(m => `
        <tr>
            <td class="text-start text-muted font-monospace"><small>#${m.id.substring(0,6)}</small></td>
            <td class="text-start fw-bold">${m.nombreAlumno} <span class="text-muted small d-block d-md-inline">(${m.claveKiosco})</span></td>
            <td class="fw-bold">$${m.monto}</td>
            <td class="text-muted">${m.fechaVencimiento}</td>
            <td class="text-muted">${m.fechaPago || '---'}</td>
            <td><span class="badge bg-${m.estado==='Pagado'?'success':(m.estado==='Vencido'?'danger':'warning')}">${m.estado}</span></td>
            <td>
                ${m.estado !== 'Pagado' ? `<button class="btn btn-sm btn-dark" onclick="registrarPago('${m.id}')">Registrar Pago</button>` : `<i class="fa-solid fa-check text-success"></i>`}
            </td>
        </tr>
    `).join('');
}

function registrarPago(id) {
    Swal.fire({
        title: 'Registrar Cobro', text: '¿Confirmas la recepción del pago?', icon: 'question', showCancelButton: true, confirmButtonColor: '#198754', confirmButtonText: 'Sí, cobrar'
    }).then(async (result) => {
        if (result.isConfirmed) {
            await fetch(`${API_URL}/Mensualidades/${id}/pagar`, { method: "POST", headers: obtenerHeaders() }); // <-- Token agregado
            Toast.fire({ icon: 'success', title: 'Pago registrado exitosamente' });
            cargarMensualidades();
        }
    });
}

// ==========================================
// MÓDULO 3: INVENTARIO (TABLA ORIGINAL)
// ==========================================
async function cargarInventario() {
    try {
        const res = await fetch(`${API_URL}/Inventario`, { headers: obtenerHeaders() }); // <-- Token agregado
        cacheInventario = await res.json();
        renderizarTablaInventario(cacheInventario);
        
        const resAlertas = await fetch(`${API_URL}/Inventario/alertas`, { headers: obtenerHeaders() }); // <-- Token agregado
        const alertas = await resAlertas.json();
        const panelAlertas = document.getElementById('panel-alertas-observer');
        if(panelAlertas){
            panelAlertas.innerHTML = alertas.map(a => `
                <div class="alert alert-danger shadow-sm border-0 fw-bold d-flex align-items-center gap-3">
                    <i class="fa-solid fa-triangle-exclamation fs-4"></i>
                    <div>${a}</div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error("Error al cargar inventario:", error);
    }
}

const buscadorInventario = document.getElementById('buscador-inventario');
if(buscadorInventario){
    buscadorInventario.addEventListener('input', (e) => {
        renderizarTablaInventario(cacheInventario.filter(p => p.nombre.toLowerCase().includes(e.target.value.toLowerCase())));
    });
}

function renderizarTablaInventario(lista) {
    const tbody = document.getElementById('tabla-inventario-body');
    if (!tbody) return;
    
    tbody.innerHTML = lista.map(p => {
        const esBajo = p.stockActual <= p.stockMinimo;
        return `
            <tr>
                <td class="text-start fw-bold">
                    <i class="fa-solid fa-box text-muted me-2"></i> ${p.nombre}
                </td>
                <td class="fs-5 fw-bold ${esBajo ? 'text-danger' : 'text-success'}">${p.stockActual}</td>
                <td class="text-muted">${p.stockMinimo}</td>
                <td><span class="badge bg-${esBajo ? 'danger' : 'success-subtle text-success'}">${esBajo ? 'Crítico' : 'Disponible'}</span></td>
                <td>
                    <button class="btn btn-sm btn-dark me-1" onclick="venderArticulo('${p.id}')" ${p.stockActual === 0 ? 'disabled' : ''}>
                        <i class="fa-solid fa-cart-shopping"></i> Vender
                    </button>
                    <button class="btn btn-sm btn-primary me-1" onclick="abrirModalEditar('${p.id}', '${p.nombre}', ${p.stockActual}, ${p.stockMinimo})">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="btn btn-sm btn-light border text-danger" onclick="eliminarInventario('${p.id}')">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

const formInventario = document.getElementById('formNuevoProducto');
if(formInventario){
    formInventario.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const data = { 
            nombre: document.getElementById('inv-nombre').value, 
            cantidad: parseInt(document.getElementById('inv-cantidad').value), 
            stockMinimo: parseInt(document.getElementById('inv-minimo').value) 
        };
        
        const res = await fetch(`${API_URL}/Inventario`, { 
            method: 'POST', 
            headers: obtenerHeaders(), // <-- Token agregado
            body: JSON.stringify(data) 
        });
        
        if (res.ok) {
            Toast.fire({ icon: 'success', title: 'Artículo agregado' });
            document.getElementById('formNuevoProducto').reset();
            cargarInventario();
        } else {
            alert("Error al guardar en la API.");
        }
    });
}

function venderArticulo(id) {
    Swal.fire({
        title: 'Precio de Venta',
        input: 'number',
        inputLabel: 'Introduce el monto en efectivo (MXN)',
        inputValue: '150',
        showCancelButton: true,
        confirmButtonText: 'Registrar Salida',
        confirmButtonColor: '#212529',
        inputValidator: (value) => {
            if (!value || value < 0) return 'El precio no puede ser negativo'
        }
    }).then(async (result) => {
        if (result.isConfirmed) {
            await fetch(`${API_URL}/Inventario/${id}/salida?cantidad=1&precioVenta=${result.value}`, { method: "POST", headers: obtenerHeaders() }); // <-- Token agregado
            Toast.fire({ icon: 'success', title: 'Venta registrada en Finanzas' });
            cargarInventario();
        }
    });
}

function eliminarInventario(id) {
    Swal.fire({ title: '¿Eliminar producto?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#d90429' })
    .then(async (res) => { if(res.isConfirmed) { await fetch(`${API_URL}/Inventario/${id}`, { method: "DELETE", headers: obtenerHeaders() }); cargarInventario(); }}); // <-- Token agregado
}

// LÓGICA DEL MODAL DE EDICIÓN
let idProductoEditando = null;

function abrirModalEditar(id, nombre, stock, minimo) {
    idProductoEditando = id;
    document.getElementById('editNombre').value = nombre;
    document.getElementById('editStock').value = stock;
    document.getElementById('editMinimo').value = minimo;
    
    document.getElementById('modalEditar').style.display = 'block';
}

function cerrarModal() {
    document.getElementById('modalEditar').style.display = 'none';
    idProductoEditando = null;
}

async function guardarEdicion() {
    const inputNombre = document.getElementById('editNombre');
    const inputStock = document.getElementById('editStock');
    const inputMinimo = document.getElementById('editMinimo');

    const nombre = inputNombre ? inputNombre.value : "";
    const nuevoStock = inputStock ? parseInt(inputStock.value) : 0;
    const nuevoStockMinimo = inputMinimo ? parseInt(inputMinimo.value) : 0;

    if (!nombre) {
        alert("El nombre no puede estar vacío");
        return;
    }

    const data = {
        nombre: nombre,
        nuevoStockActual: isNaN(nuevoStock) ? 0 : nuevoStock,
        nuevoStockMinimo: isNaN(nuevoStockMinimo) ? 0 : nuevoStockMinimo
    };

    const res = await fetch(`${API_URL}/Inventario/${idProductoEditando}`, {
        method: 'PUT',
        headers: obtenerHeaders(), // <-- Token agregado
        body: JSON.stringify(data)
    });

    if (res.ok) {
        cerrarModal();
        Toast.fire({ icon: 'success', title: 'Artículo actualizado' });
        cargarInventario();
    } else {
        alert("Error al editar el artículo. Revisa la consola.");
    }
}

// ==========================================
// MÓDULO 4: FINANZAS
// ==========================================
async function cargarFinanzas() {
    const res = await fetch(`${API_URL}/Finanzas`, { headers: obtenerHeaders() }); // <-- Token agregado
    cacheFinanzas = await res.json();
    
    const tbody = document.getElementById('tabla-finanzas-body');
    if(!tbody) return;

    tbody.innerHTML = cacheFinanzas.map(f => `
        <tr>
            <td class="fw-bold text-start"><i class="fa-solid fa-calendar text-muted me-2"></i> ${f.mesAnio}</td>
            <td class="text-muted">$${f.ingresosMensualidades.toFixed(2)}</td>
            <td class="text-muted">$${f.ingresosVentas.toFixed(2)}</td>
            <td><span class="badge bg-secondary">${f.ventasRealizadas} arts.</span></td>
            <td class="text-dark fw-bold fs-6">$${f.total.toFixed(2)}</td>
            <td><button class="btn btn-sm btn-light border text-danger" onclick="eliminarMes('${f.mesAnio}')"><i class="fa-solid fa-trash"></i></button></td>
        </tr>
    `).join('');

    if (cacheFinanzas.length > 0) {
        document.getElementById('total-mensualidades').innerText = `$${cacheFinanzas[0].ingresosMensualidades.toFixed(2)}`;
        document.getElementById('total-ventas').innerText = `$${cacheFinanzas[0].ingresosVentas.toFixed(2)}`;
        document.getElementById('total-utilidad').innerText = `$${cacheFinanzas[0].total.toFixed(2)}`;
    } else {
        document.getElementById('total-mensualidades').innerText = `$0.00`;
        document.getElementById('total-ventas').innerText = `$0.00`;
        document.getElementById('total-utilidad').innerText = `$0.00`;
    }
}

function eliminarMes(mesAnio) {
    Swal.fire({ title: '¿Borrar historial?', icon: 'error', text: 'Esto es permanente', showCancelButton: true, confirmButtonColor: '#d90429' })
    .then(async (res) => { if(res.isConfirmed) { await fetch(`${API_URL}/Finanzas/${mesAnio}`, { method: "DELETE", headers: obtenerHeaders() }); cargarFinanzas(); }}); // <-- Token agregado
}

// Función extra para cerrar sesión (Puedes llamarla desde un botón en tu HTML)
function cerrarSesionCoach() {
    localStorage.removeItem('coachToken');
    window.location.href = 'login.html';
}