
// Función para agregar un cliente
function addClient() {
    const clientName = document.getElementById('client-name').value;
    const clientAlias = document.getElementById('client-alias').value;
    const clientAge = parseInt(document.getElementById('client-age').value);
    
    if (!clientName || !clientAlias || isNaN(clientAge)) {
        alert('Por favor, complete todos los campos correctamente.');
        return;
    }

    // Generar un ID único para el cliente
    const clientId = db.collection('clients').doc().id;

    db.collection('clients').doc(clientId).set({
        id: clientId,
        name: clientName,
        alias: clientAlias,
        age: clientAge,
        ranking: 0, // Valor inicial de ranking
        isActive: false, // Valor inicial de isActive
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        console.log("Cliente añadido");

        document.getElementById('client-name').value = '';
        document.getElementById('client-alias').value = '';
        document.getElementById('client-age').value = '';
        
        
    }).catch((error) => {
        console.error("Error añadiendo cliente: ", error);
    });
    loadClientOptionsForVisit();
    loadClientOptions();
    
}


// Función para cargar y mostrar los clientes en la sección clilist
function fetchClientList() {
    const filter = document.getElementById('client-filter').value;
    const sortField = filter === 'age' ? 'age' : (filter === 'ranking' ? 'ranking'  : 'name');
    const sortOrder = 'desc';

    db.collection('clients').orderBy(sortField, sortOrder).get().then((querySnapshot) => {
        const clientList = document.getElementById('client-list');
        clientList.innerHTML = '';

        // Crear tabla
        const table = document.createElement('table');
        table.classList.add('client-table');

        // Crear encabezado de tabla
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        ['#', 'Nombre', 'Alias', 'Edad', 'Ranking'].forEach(headerText => {
            const th = document.createElement('th');
            th.textContent = headerText;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        // Crear cuerpo de tabla
        const tbody = document.createElement('tbody');

        querySnapshot.forEach((doc) => {
            const client = doc.data();
            const row = document.createElement('tr');

            const indexCell = document.createElement('td');
            // La numeración se genera localmente al renderizar
            indexCell.className = 'index-cell';
            row.appendChild(indexCell);

            const nameCell = document.createElement('td');
            nameCell.textContent = client.name;
            row.appendChild(nameCell);

            const aliasCell = document.createElement('td');
            aliasCell.textContent = client.alias;
            row.appendChild(aliasCell);

            const ageCell = document.createElement('td');
            ageCell.textContent = client.age;
            row.appendChild(ageCell);

            const rankingCell = document.createElement('td');
            rankingCell.textContent = client.ranking;
            row.appendChild(rankingCell);

            tbody.appendChild(row);
        });

        table.appendChild(tbody);
        clientList.appendChild(table);

        // Asignar numeración a cada fila
        assignRowNumbers();
    }).catch((error) => {
        console.error("Error obteniendo clientes: ", error);
    });
}

// Función para asignar numeración a cada fila
function assignRowNumbers() {
    const rows = document.querySelectorAll('.client-table tbody tr');
    rows.forEach((row, index) => {
        const indexCell = row.querySelector('.index-cell');
        indexCell.textContent = index + 1;
    });
}

// Función para cargar datos del cliente seleccionado para editar
function loadClientDataForEdit() {
    const clientId = document.getElementById('edit-client-select').value;
    if (!clientId) return;

    db.collection('clients').doc(clientId).get().then((doc) => {
        if (doc.exists) {
            const client = doc.data();
            document.getElementById('edit-client-name').value = client.name;
            document.getElementById('edit-client-alias').value = client.alias;
            document.getElementById('edit-client-age').value = client.age;
            document.getElementById('edit-client-ranking').value = client.ranking;
        } else {
            console.log("Cliente no encontrado");
        }
    }).catch((error) => {
        console.error("Error obteniendo datos del cliente: ", error);
    });
}

// Función para actualizar un cliente
function editClient() {
    const clientId = document.getElementById('edit-client-select').value;
    const newName = document.getElementById('edit-client-name').value;
    const newAlias = document.getElementById('edit-client-alias').value;
    const newAge = parseInt(document.getElementById('edit-client-age').value);
    const newRanking = parseInt(document.getElementById('edit-client-ranking').value);

    if (!clientId || !newName || !newAlias || isNaN(newAge) || isNaN(newRanking)) {
        alert('Por favor, complete todos los campos correctamente.');
        return;
    }

    db.collection('clients').doc(clientId).update({
        name: newName,
        alias: newAlias,
        age: newAge,
        ranking: newRanking
    }).then(() => {
        console.log("Cliente actualizado");
        document.getElementById('edit-client-select').value = '';
        document.getElementById('edit-client-name').value = '';
        document.getElementById('edit-client-alias').value = '';
        document.getElementById('edit-client-age').value = '';
        document.getElementById('edit-client-ranking').value = '';
        fetchClients('list'); // Actualizar lista de clientes después de editar
    }).catch((error) => {
        console.error("Error actualizando cliente: ", error);
    });
}

// Función para eliminar un cliente
function deleteClient() {
    const clientId = document.getElementById('delete-client-select').value;

    db.collection('clients').doc(clientId).delete().then(() => {
        console.log("Cliente eliminado");
        fetchClients('delete'); // Actualizar opciones de clientes después de eliminar
    }).catch((error) => {
        console.error("Error eliminando cliente: ", error);
    });
}

function fetchClients(formType) {
    const selectElement = formType === 'edit' ? document.getElementById('edit-client-select') : 
                          formType === 'delete' ? document.getElementById('delete-client-select') :
                          null;

    if (selectElement) {
        selectElement.innerHTML = ''; // Limpiar opciones anteriores
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Seleccione un cliente';
        selectElement.appendChild(defaultOption);
    }

    const clientSort = document.getElementById('client-sort');
    const sortOption = clientSort ? clientSort.value : 'name-asc';
    let sortField = 'name';
    let sortOrder = 'asc';

    if (sortOption === 'createdAt-desc') {
        sortField = 'createdAt';
        sortOrder = 'desc';
    } else if (sortOption === 'ranking-desc') {
        sortField = 'ranking';
        sortOrder = 'desc';
    }

    db.collection('clients').orderBy(sortField, sortOrder).get().then((querySnapshot) => {
        const clientList = document.getElementById('clients-list');
        if (clientList) {
            clientList.innerHTML = '';
        }

        querySnapshot.forEach((doc) => {
            const client = doc.data();
            if (selectElement) {
                const option = document.createElement('option');
                option.value = doc.id;
                option.textContent = client.name;
                selectElement.appendChild(option);
            }

            if (clientList) {
                const listItem = document.createElement('li');
                listItem.textContent = `${client.name} (Alias: ${client.alias}, Edad: ${client.age}, Ranking: ${client.ranking}, Fecha: ${client.createdAt.toDate().toLocaleDateString()})`;
                clientList.appendChild(listItem);
            }
        });
    }).catch((error) => {
        console.error("Error obteniendo clientes: ", error);
    });
}

// Llamar a fetchClients con el filtro por defecto al cargar la página
document.addEventListener('DOMContentLoaded', (event) => {
   
    loadClientDataForEdit() ;
    fetchClients('list');
    fetchClients('edit');
    fetchClients('delete');
    fetchClientList();

});
