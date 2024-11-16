

// Función para cargar las opciones de categoría y clasificación
function loadOptions() {
    const categoriaSelect = document.getElementById('categoria');
    const clasificacionSelect = document.getElementById('clasificacion');

    // Cargar opciones de categoría
    const categorias = ["Gastos de personal", "Proveedores", "Suministros y pequeños enseres"];
    categorias.forEach(categoria => {
        const option = document.createElement('option');
        option.value = categoria;
        option.textContent = categoria;
        categoriaSelect.appendChild(option);
    });

    // Cargar opciones de clasificación
    const clasificaciones = ["reinversión", "suministro", "gasto"];
    clasificaciones.forEach(clasificacion => {
        const option = document.createElement('option');
        option.value = clasificacion;
        option.textContent = clasificacion;
        clasificacionSelect.appendChild(option);
    });
}

// Ejecutar la función para cargar las opciones al cargar el DOM
document.addEventListener('DOMContentLoaded', loadOptions);

// Configuración de la zona horaria para Guatemala
const today = new Date().toLocaleString("en-US", { timeZone: "America/Guatemala" });
const visitID = new Date(today).toISOString().slice(0, 10); // Formato YYYY-MM-DD

document.getElementById('registro-egresos-form').addEventListener('submit', function(e) {
    e.preventDefault();

    const nombre = document.getElementById('nombre').value;
    const totaldegasto = parseFloat(document.getElementById('totaldegasto').value);
    const categoria = document.getElementById('categoria').value;
    const clasificacion = document.getElementById('clasificacion').value;

    const gastoRef = db.collection('Gasto').doc(visitID);

    db.runTransaction((transaction) => {
        return transaction.get(gastoRef).then((doc) => {
            if (!doc.exists) {
                transaction.set(gastoRef, {
                    fecha: today,
                    TotalgastoDia: totaldegasto,
                    "1": {
                        nombre: nombre,
                        totaldegasto: totaldegasto,
                        categoria: categoria,
                        clasificacion: clasificacion
                    }
                });
            } else {
                const data = doc.data();
                const newTotal = data.TotalgastoDia + totaldegasto;
                const newNumVen = Object.keys(data).length;

                const updateData = {
                    TotalgastoDia: newTotal
                };
                updateData[newNumVen] = {
                    nombre: nombre,
                    totaldegasto: totaldegasto,
                    categoria: categoria,
                    clasificacion: clasificacion
                };

                transaction.update(gastoRef, updateData);
            }
        });
    }).then(() => {
        console.log("Gasto registrado con éxito!");
        document.getElementById('registro-egresos-form').reset();
    }).catch((error) => {
        console.error("Error registrando el gasto: ", error);
    });
});
