document.addEventListener('DOMContentLoaded', () => {
    const queryState = {
        selectedTables: [],
        selectedColumns: {} // { tableName: [columns] }
    };

    const tableSelector = document.getElementById('selecting_table');
    const loadColumnsBtn = document.getElementById('load_columns_btn');
    const columnsContainer = document.getElementById('columns_container');
    const section2 = document.getElementById('selecting_output_columns');
    const columnForm = document.getElementById('columnForm');

    loadColumnsBtn.addEventListener('click', async () => {
        const selectedOptions = Array.from(tableSelector.selectedOptions);
        queryState.selectedTables = selectedOptions.map(option => option.value);
        queryState.selectedColumns = {}; // Reset previously selected columns
        columnsContainer.innerHTML = ''; // Clear previous UI

        if (queryState.selectedTables.length === 0) {
            section2.style.display = 'none';
            return;
        }

        for (const table of queryState.selectedTables) {
            try {
                const response = await fetch(`/get_columns/?table_name=${table}`);
                const data = await response.json();
                const fieldset = document.createElement('fieldset');
                const legend = document.createElement('legend');
                legend.textContent = table;
                fieldset.appendChild(legend);

                data.columns.forEach(col => {
                    const label = document.createElement('label');
                    label.innerHTML = `
                        <input type="checkbox" name="${table}_columns" value="${col}"> ${col}
                    `;
                    fieldset.appendChild(label);
                    fieldset.appendChild(document.createElement('br'));
                });

                columnsContainer.appendChild(fieldset);
                section2.style.display = 'block';
            } catch (error) {
                console.error(`Error fetching columns for ${table}:`, error);
            }
        }
    });

    columnForm.addEventListener('submit', event => {
        event.preventDefault();

        queryState.selectedColumns = {};

        queryState.selectedTables.forEach(table => {
            const checkboxes = document.querySelectorAll(`input[name="${table}_columns"]:checked`);
            const selected = Array.from(checkboxes).map(cb => cb.value);
            if (selected.length > 0) {
                queryState.selectedColumns[table] = selected;
            }
        });

        console.log("✅ Query State:", queryState);

        alert("Selected columns saved. You can proceed to the next section.");
    });
});
