// Clientes
const form = document.getElementById("formCliente");
const lista = document.getElementById("clientes");

let clientes = JSON.parse(localStorage.getItem("clientes")) || [];

mostrarClientes();

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const id = form.dataset.editingId || Date.now();
  const nombre = document.getElementById("nombre").value;
  const cedula = document.getElementById("cedula").value;
  const telefono = document.getElementById("telefono").value;
  const estado = document.getElementById("estado").value;

  if (!nombre || !cedula) {
    alert("Nombre y cédula son obligatorios.");
    return;
  }

  const cliente = { id: Number(id), nombre, cedula, telefono, estado };

  if (form.dataset.editingId) {
    const index = clientes.findIndex(c => c.id == id);
    clientes[index] = cliente;
    delete form.dataset.editingId;
  } else {
    clientes.push(cliente);
  }

  guardarClientes();
  mostrarClientes();
  cargarClientesEnSelect();
  form.reset();
});

function guardarClientes() {
  localStorage.setItem("clientes", JSON.stringify(clientes));
}

function mostrarClientes() {
  lista.innerHTML = "";
  clientes.forEach((cliente) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${cliente.nombre}</strong> - ${cliente.cedula} - ${cliente.estado.toUpperCase()}<br/>
      <small>Tel: ${cliente.telefono || "N/A"}</small><br/>
      <button onclick="editarCliente(${cliente.id})">Editar</button>
      <button onclick="eliminarCliente(${cliente.id})">Eliminar</button>
    `;
    lista.appendChild(li);
  });
}

function editarCliente(id) {
  const cliente = clientes.find(c => c.id === id);
  document.getElementById("nombre").value = cliente.nombre;
  document.getElementById("cedula").value = cliente.cedula;
  document.getElementById("telefono").value = cliente.telefono;
  document.getElementById("estado").value = cliente.estado;
  form.dataset.editingId = cliente.id;
}

function eliminarCliente(id) {
  if (confirm("¿Seguro que deseas eliminar este cliente?")) {
    clientes = clientes.filter(c => c.id !== id);
    guardarClientes();
    mostrarClientes();
    cargarClientesEnSelect();
  }
}

// Prestamos
const prestamoForm = document.getElementById("formPrestamo");
const listaPrestamos = document.getElementById("prestamos");
const selectClientes = document.getElementById("clienteCedula");
const listaActivos = document.getElementById("prestamos-activos");

let prestamos = JSON.parse(localStorage.getItem("prestamos")) || [];

cargarClientesEnSelect();
mostrarPrestamos();

prestamoForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const clienteCedula = selectClientes.value;
  const monto = parseFloat(document.getElementById("monto").value);
  const interes = parseFloat(document.getElementById("interes").value);
  const cuotas = parseInt(document.getElementById("cuotas").value);
  const fecha = document.getElementById("fecha").value;
  const frecuencia = document.getElementById("frecuencia").value;

  const nuevoPrestamo = {
    id: Date.now(),
    clienteCedula,
    monto,
    interes,
    cuotas,
    fecha,
    frecuencia,
    pagos: []
  };

  prestamos.push(nuevoPrestamo);
  localStorage.setItem("prestamos", JSON.stringify(prestamos));
  mostrarPrestamos();
  prestamoForm.reset();
});

function cargarClientesEnSelect() {
  if (!selectClientes) return;
  selectClientes.innerHTML = "<option disabled selected>Seleccione un cliente</option>";
  clientes.forEach(cliente => {
    const option = document.createElement("option");
    option.value = cliente.cedula;
    option.textContent = `${cliente.nombre} (${cliente.cedula})`;
    selectClientes.appendChild(option);
  });
}

function mostrarPrestamos() {
  listaPrestamos.innerHTML = "";
  const ultimos = prestamos.slice(-3).reverse();

  ultimos.forEach(prestamo => {
    const cliente = clientes.find(c => c.cedula === prestamo.clienteCedula);
    const cuota = calcularCuota(prestamo.monto, prestamo.interes, prestamo.cuotas);
    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${cliente ? cliente.nombre : "Cliente no encontrado"}</strong><br/>
      Monto: $${prestamo.monto.toFixed(2)} - Interés: ${prestamo.interes}% - Cuotas: ${prestamo.cuotas} - Cuota: $${cuota}<br/>
      Fecha: ${prestamo.fecha}<br/>
      <button onclick="registrarPago(${prestamo.id})">Registrar Pago</button>
      <button onclick="eliminarPrestamo(${prestamo.id})">Eliminar</button>
      <div id="historial-${prestamo.id}">${mostrarHistorial(prestamo)}</div>
    `;
    listaPrestamos.appendChild(li);
  });
}

function mostrarPrestamosActivos() {
  listaActivos.innerHTML = "";
  const activos = prestamos.filter(p => (p.pagos ? p.pagos.length : 0) < p.cuotas);

  activos.forEach(prestamo => {
    const cliente = clientes.find(c => c.cedula === prestamo.clienteCedula);
    const cuota = calcularCuota(prestamo.monto, prestamo.interes, prestamo.cuotas);
    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${cliente ? cliente.nombre : "Cliente no encontrado"}</strong><br/>
      Monto: $${prestamo.monto.toFixed(2)} - Interés: ${prestamo.interes}% - Cuotas: ${prestamo.cuotas} - Cuota: $${cuota}<br/>
      Pagos: ${prestamo.pagos ? prestamo.pagos.length : 0} / ${prestamo.cuotas}<br/>
      <button onclick="registrarPago(${prestamo.id})">Registrar Pago</button>
      <div id="historial-activo-${prestamo.id}">${mostrarHistorial(prestamo)}</div>
    `;
    listaActivos.appendChild(li);
  });
}

function registrarPago(id) {
  const prestamo = prestamos.find(p => p.id === id);
  const fechaPago = prompt("Ingrese la fecha del pago (AAAA-MM-DD):", new Date().toISOString().split("T")[0]);
  if (!fechaPago) return;

  const tipoPago = prompt("¿Tipo de pago?\n1 = Abono al Capital\n2 = Abono al Interés");
  if (tipoPago !== "1" && tipoPago !== "2") return alert("Opción no válida.");

  let monto = 0;
  if (tipoPago === "1") {
    monto = parseFloat(prompt("Ingrese monto a abonar al CAPITAL:"));
  } else {
    monto = parseFloat(prompt("Ingrese monto a abonar al INTERÉS:"));
  }

  if (isNaN(monto) || monto <= 0) {
    alert("Monto invalido.");
    return;
  }
  if (!prestamo.pagos) prestamo.pagos = [];
  prestamo.pagos.push({
    fecha: fechaPago,
    tipo: tipoPago === "1" ? "capital" : "interes",
    monto: monto
  });

  localStorage.setItem("prestamos", JSON.stringify(prestamos));
  mostrarPrestamos();
  mostrarPrestamosActivos();
}

function mostrarHistorial(prestamo) {
  if (!prestamo.pagos || prestamo.pagos.length === 0) return "<em>Sin pagos registrados.</em>";
  return "<strong>Historial de pagos:</strong><ul>" +
  prestamo.pagos.map(p => `<li>${p.fecha} - $${p.monto.toFixed(2)} - ${p.tipo}</li>`).join("") +
  "</ul>";
}

function calcularCuota(monto, interes, cuotas) {
  const tasaMensual = interes / 100;
  const cuota = (monto + (monto * tasaMensual)) / cuotas;
  return cuota.toFixed(2);
}

function mostrarSeccion(seccion) {
  const secciones = {
    clientes: document.getElementById("vista-clientes"),
    prestamos: document.getElementById("vista-prestamos"),
    activos: document.getElementById("vista-activos"),
    historial: document.getElementById("vista-historial")
  };

  for (const key in secciones) {
    secciones[key].style.display = key === seccion ? "block" : "none";
  }

  if (seccion === "activos") {
    mostrarPrestamosActivos();
  }
  if (seccion === "historial") {
    mostrarPrestamosHistorial();
  }

  function calcularSaldoRestante(prestamo) {
    const capitalPagado = prestamo.pagos
    ? prestamo.pagos.filter(p => p.tipo === "capital").reduce((acc, p) => acc + p.monto, 0)
    : 0;

    const interesTotal = parseFloat(prestamo.monto) * (prestamo.interes / 100);
    const interesPagado = prestamo.pagos
    ? prestamo.pagos.filter(p => p.tipo === "interes").reduce((acc, p) => acc + p.monto, 0)
    : 0;

    const capitalRestante = parseFloat(prestamo.monto) - capitalPagado;
    const interesRestante = interesTotal - interesPagado;

    return {
      capital: capitalRestante > 0 ? capitalRestante.toFixed(2) : "0.00",
      interes: interesRestante > 0 ? interesRestante.toFixed(2) : "0.00",
      total: (capitalRestante + interesRestante).toFixed(2)
    };
  }

  function registrarPago(id) {
    const prestamo = prestamo.find(p => p.id === id);
    const cuota = parseFloat(calcularCuota(prestamo.monto, prestamo.interes, prestamo.cuotas));
    const fechaPago = prompt("Ingrese la fecha del pago (AAAA-MM-DD):", new Date().toISOString().split("T")[0]);
    if (!fechaPago) return;

    if (!prestamo.pagos) prestamo.pagos = [];
    prestamo.pagos.push({ fecha: fechaPago, monto: cuota });

    localStorage.setItem("prestamos", JSON.stringify(prestamos));
    mostrarPrestamos();
    mostrarPrestamosActivos();
  }

  function mostrarHistorial(prestamo) {
    if (!prestamo.pagos || prestamo.pagos.length === 0) return "<em>Sin pagos registrados.</em>";
    return "<strong>Historial de pagos:</strong><ul>" +
    prestamo.pagos.map(p => `<li>${p.fecha} - $${parseFloat(p.monto).toFixed(2)}</li>`).join("") +
    "</ul";
  }

  function mostrarPrestamosActivos() {
    listaActivos.innerHTML = "";
    const activos = prestamos.filter(p => {
      const saldo = calcularSaldoRestante(p);
      return parseFloat(saldo.capital) > 0 || parseFloat(saldo.interes) > 0;
      });

    activos.forEach(prestamo => {
      const cliente = clientes.find(c => c.cedula === prestamo.clienteCedula);
      const cuota = calcularCuota(prestamo.monto, prestamo.interes, prestamo.cuotas);
      const saldo = calcularSaldoRestante(prestamo);
      const capitalPagado = prestamo.pagos
       ? prestamo.pagos.filter(p => p.tipo === "capital").reduce((acc, p) => acc + p.monto, 0)
       : 0;

       const cuotaValor = parseFloat(calcularCuota(prestamo.monto, prestamo.interes, prestamo.cuotas));
       const cuotasPagadas = Math.floor(capitalPagado / cuotaValor);
       const cuotasRestantes = Math.max(0, prestamo.cuotas - cuotasPagadas);
      const li = document.createElement("li");

      li.innerHTML = `
      <strong>${cliente ? cliente.nombre : "Cliente no encontrado"}</strong><br/>
      Monto: $${prestamo.monto.toFixed(2)} - Interés: ${prestamo.interes}%<br/>
      Cuotas: ${prestamo.cuotas} (${prestamo.frecuencia}) - Cuota: $${cuota}<br/>
      Pagos: ${prestamo.pagos ? prestamo.pagos.length : 0} / ${prestamo.cuotas}<br/>
      <strong>Capital restante:</strong> $${saldo.capital} <br/>
      <strong>Interés restante:</strong> $${saldo.interes} <br/>
      <strong>Total a pagar:</strong> $${saldo.total}
      <strong>Cuotas restantes (aprox.):</strong> ${cuotasRestantes} <br/>
      <button onclick="registrarPago(${prestamo.id})">Registrar Pago</button>
      <div id="historial-activo-${prestamo.id}">${mostrarHistorial(prestamo)}</div>
      `;
      listaActivos.appendChild(li);
    });
  }

  function mostrarPrestamosHistorial() {
    const contenedor = document.getElementById("prestamos-historial");
    contenedor.innerHTML = "";

    const saldados = prestamos.filter(p => {
      const saldo = calcularSaldoRestante(p);
      return parseFloat(saldo.capital) <= 0 && parseFloat(saldo.interes) <= 0;
    });

    saldados.forEach(prestamo => {
      const cliente = clientes.find(c => c.cedula === prestamo.clienteCedula);
      const li = document.createElement("li");

      const resumen = `
      <strong>${cliente ? cliente.nombre : "Cliente no encontrado"}</strong><br/>
      Monto: $${prestamo.monto.toFixed(2)} | Interés: ${prestamo.interes}%<br/>
      Fecha: ${prestamo.fecha}<br/>
      <strong style="color:green;">SALDADO</strong>
      `;

      const detalle = `
      <div class="detalle-historial" style="display:none; margin-top:5px;">
      <strong>Frecuencia:</strong> ${prestamo.frecuencia}<br/>
      <strong>Cuotas:</strong> ${prestamo.cuotas}<br/>
      <strong>Historial de pagos:</strong><br/>
      ${mostrarHistorial(prestamo)}
      </div>
      `;

      li.innerHTML = `<div onclick="this.querySelector('.detalle-historial').style.display =
      this.querySelector('.detalle-historial').style.display === 'none' ? 'block' : 'none';" style="cursor:pointer;">
      ${resumen}${detalle}
      </div>`;

      contenedor.appendChild(li);
    });
  }
}