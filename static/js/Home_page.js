document.addEventListener('DOMContentLoaded', async () => {
  const tableSelector = document.getElementById('selecting_table');
  const loadColumnsBtn = document.getElementById('load_columns_btn');
  const columnsContainer = document.getElementById('columns_container');
  const conditionColumnSelectors = document.getElementById('condition_column_selectors');
  const conditionsContainer = document.getElementById('conditions_container');
  const section2 = document.getElementById('selecting_output_columns');
  const section3 = document.getElementById('selecting_conditions_section');
  const section4 = document.getElementById('submit_query_section');
  const submitQueryBtn = document.getElementById('submit_query_btn');



  const selectedOutputColumns = {};
  const selectedConditionColumns = {};
  const conditionValuesState = {};
  const allColumns = {};

  // Load all tables
  async function loadAllTables() {
    try {
      const response = await fetch('/get_all_tables');
      const tablesData = await response.json();

      if (tablesData.tables && Array.isArray(tablesData.tables)) {
        tableSelector.innerHTML = '';
        tablesData.tables.forEach(tableName => {
          const option = new Option(tableName, tableName);
          tableSelector.appendChild(option);
        });
      } else {
        console.warn('No tables data received from server.');
      }
    } catch (error) {
      console.error('Failed to load tables:', error);
    }
  }

  await loadAllTables();

  const tableChoice = new Choices(tableSelector, {
    removeItemButton: true,
    searchEnabled: true,
    placeholderValue: 'Select table(s)...',
  });

  loadColumnsBtn.addEventListener('click', async () => {
    const selectedTables = Array.from(tableSelector.selectedOptions).map(opt => opt.value);
    if (!selectedTables.length) {
      alert('⚠️ Please select at least one table.');
      return;
    }

    Object.keys(selectedOutputColumns).forEach(key => delete selectedOutputColumns[key]);
    Object.keys(selectedConditionColumns).forEach(key => delete selectedConditionColumns[key]);

    section2.style.display = 'block';
    section3.style.display = 'block';
    section4.style.display = 'block';
    columnsContainer.innerHTML = '';
    conditionColumnSelectors.innerHTML = '';
    conditionsContainer.innerHTML = '';

    for (const table of selectedTables) {
      try {
        const res = await fetch(`/get_columns/?table_name=${encodeURIComponent(table)}`);
        const data = await res.json();
        allColumns[table] = data.columns || [];

        renderOutputColumnSelection(table, allColumns[table]);
        renderConditionColumnSelection(table, allColumns[table]);
      } catch (err) {
        console.error(`Error fetching columns for ${table}:`, err);
      }
    }

    initJoinSection(selectedTables);
  });

  function renderOutputColumnSelection(table, columns) {
    const fieldset = document.createElement('fieldset');
    const legend = document.createElement('legend');
    legend.innerHTML = `<strong>${table}</strong> - Output Columns`;
    fieldset.appendChild(legend);

    columns.forEach(col => {
      const id = `${table}_${col}`;
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = id;
      checkbox.value = col;

      checkbox.addEventListener('change', () => {
        selectedOutputColumns[table] = selectedOutputColumns[table] || [];
        if (checkbox.checked) {
          if (!selectedOutputColumns[table].includes(col)) {
            selectedOutputColumns[table].push(col);
          }
        } else {
          selectedOutputColumns[table] = selectedOutputColumns[table].filter(c => c !== col);
        }
      });

      const label = document.createElement('label');
      label.setAttribute('for', id);
      label.textContent = col;

      const div = document.createElement('div');
      div.appendChild(checkbox);
      div.appendChild(label);
      fieldset.appendChild(div);
    });

    columnsContainer.appendChild(fieldset);
  }

  function renderConditionColumnSelection(table, columns) {
    const fieldset = document.createElement('fieldset');
    const legend = document.createElement('legend');
    legend.innerHTML = `<strong>${table}</strong> - Columns to Filter`;
    fieldset.appendChild(legend);

    columns.forEach(col => {
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = `condition_${table}_${col}`;
      checkbox.value = col;

      checkbox.addEventListener('change', () => {
        selectedConditionColumns[table] = selectedConditionColumns[table] || [];
        if (checkbox.checked) {
          if (!selectedConditionColumns[table].includes(col)) {
            selectedConditionColumns[table].push(col);
          }
        } else {
          selectedConditionColumns[table] = selectedConditionColumns[table].filter(c => c !== col);
          delete conditionValuesState[`${table}__${col}`];
        }
        renderConditionBlocks();
      });

      const label = document.createElement('label');
      label.setAttribute('for', checkbox.id);
      label.textContent = col;

      const wrapper = document.createElement('div');
      wrapper.appendChild(checkbox);
      wrapper.appendChild(label);
      fieldset.appendChild(wrapper);
    });

    conditionColumnSelectors.appendChild(fieldset);
  }

  function renderConditionBlocks() {
    conditionsContainer.innerHTML = '';
    const allKeys = Object.entries(selectedConditionColumns);

    for (let outerIndex = 0; outerIndex < allKeys.length; outerIndex++) {
      const [table, columns] = allKeys[outerIndex];
      for (let colIndex = 0; colIndex < columns.length; colIndex++) {
        const col = columns[colIndex];
        const key = `${table}__${col}`;
        const block = document.createElement('div');
        block.className = 'condition-block';
        block.style.marginBottom = '15px';

        // --- Logical Condition Dropdown (Skip for first block)
        if (outerIndex > 0 || colIndex > 0) {
          const logicLabel = document.createElement('label');
          logicLabel.textContent = 'Combine with previous using:';

          const logicSelect = document.createElement('select');
          logicSelect.innerHTML = `
            <option value="AND">AND</option>
            <option value="OR">OR</option>
          `;
          logicSelect.addEventListener('change', () => {
            conditionValuesState[key] = {
              ...conditionValuesState[key],
              logic: logicSelect.value,
            };
          });

          block.appendChild(logicLabel);
          block.appendChild(document.createElement('br'));
          block.appendChild(logicSelect);
          block.appendChild(document.createElement('br'));
        }

        // --- The rest of your block: operator, radio toggle, value input ---
        const label = document.createElement('label');
        label.innerHTML = `Filter <strong>${table}.${col}</strong>`;
        const operatorSelect = document.createElement('select');
        operatorSelect.innerHTML = `
          <option value="=">=</option>
          <option value="!=">!=</option>
          <option value=">">></option>
          <option value="<"><</option>
          <option value=">=">>=</option>
          <option value="<="><=</option>
        `;
        operatorSelect.addEventListener('change', () => {
          conditionValuesState[key] = {
            ...conditionValuesState[key],
            operator: operatorSelect.value,
          };
        });

        // Radio mode: select or custom
        const valueModeRadio = document.createElement('input');
        valueModeRadio.type = 'radio';
        valueModeRadio.name = `mode_${key}`;
        valueModeRadio.value = 'select';
        valueModeRadio.checked = true;

        const customModeRadio = document.createElement('input');
        customModeRadio.type = 'radio';
        customModeRadio.name = `mode_${key}`;
        customModeRadio.value = 'custom';

        const selectLabel = document.createElement('label');
        selectLabel.textContent = 'Choose from existing values';

        const customLabel = document.createElement('label');
        customLabel.textContent = 'Enter custom value';

        const valueSelect = document.createElement('select');
        valueSelect.disabled = false;

        const customInput = document.createElement('input');
        customInput.type = 'text';
        customInput.placeholder = 'Your custom value';
        customInput.disabled = true;

        valueModeRadio.addEventListener('change', () => {
          if (valueModeRadio.checked) {
            valueSelect.disabled = false;
            customInput.disabled = true;
            customInput.value = '';
            conditionValuesState[key] = {
              ...conditionValuesState[key],
              valueMode: 'select',
              value: valueSelect.value,
              customValue: '',
            };
          }
        });

        customModeRadio.addEventListener('change', () => {
          if (customModeRadio.checked) {
            valueSelect.disabled = true;
            customInput.disabled = false;
            valueSelect.value = '';
            conditionValuesState[key] = {
              ...conditionValuesState[key],
              valueMode: 'custom',
              value: '',
              customValue: customInput.value,
            };
          }
        });

        valueSelect.addEventListener('change', () => {
          if (valueModeRadio.checked) {
            conditionValuesState[key] = {
              ...conditionValuesState[key],
              value: valueSelect.value,
            };
          }
        });

        customInput.addEventListener('input', () => {
          if (customModeRadio.checked) {
            conditionValuesState[key] = {
              ...conditionValuesState[key],
              customValue: customInput.value,
            };
          }
        });

        fetch(`/get_distinct_column_values/?table=${encodeURIComponent(table)}&column=${encodeURIComponent(col)}`)
          .then(res => res.json())
          .then(data => {
            valueSelect.innerHTML = '';
            const values = data.values || [];
            const seen = new Set();

            values.forEach(val => {
              const option = document.createElement('option');
              option.value = val === null ? '__NULL__' : val;
              option.textContent = (val === null || val === 'null') ? 'NULL' : val;
              if (!seen.has(option.value)) {
                seen.add(option.value);
                valueSelect.appendChild(option);
              }
            });

            if (!seen.has('__NULL__')) {
              valueSelect.appendChild(new Option('NULL', '__NULL__'));
            }
          });

        block.appendChild(label);
        block.appendChild(document.createElement('br'));
        block.appendChild(operatorSelect);
        block.appendChild(document.createElement('br'));

        block.appendChild(valueModeRadio);
        block.appendChild(selectLabel);
        block.appendChild(document.createElement('br'));
        block.appendChild(valueSelect);
        block.appendChild(document.createElement('br'));

        block.appendChild(customModeRadio);
        block.appendChild(customLabel);
        block.appendChild(document.createElement('br'));
        block.appendChild(customInput);

        conditionsContainer.appendChild(block);
      }
    }
  }



  function initJoinSection(tables) {
      const joinSection = document.getElementById('join_section');
      if (!tables.length) {
          joinSection.style.display = 'none';
          return;
      }
      joinSection.style.display = 'block';

      const dynamicJoinsContainer = document.getElementById('dynamic_joins_container');
      dynamicJoinsContainer.innerHTML = ''; // Clear previous joins

      const createJoinBlock = (index) => {
          const wrapper = document.createElement('div');
          wrapper.className = 'join-block';
          wrapper.style.display = 'flex';
          wrapper.style.flexWrap = 'wrap';
          wrapper.style.gap = '20px';
          wrapper.style.alignItems = 'flex-start';
          wrapper.style.border = '1px solid #ccc';
          wrapper.style.padding = '10px';
          wrapper.style.borderRadius = '8px';
          wrapper.style.position = 'relative';

          // Basic innerHTML structure
          wrapper.innerHTML = `
              <div style="flex: 1; min-width: 220px;">
                  <label><strong>Table 1:</strong></label><br/>
                  <select class="join_table1_select" style="width: 100%;"></select>
              </div>
              <div style="flex: 1; min-width: 220px;">
                  <label><strong>Table 1 Column:</strong></label><br/>
                  <select class="join_table1_column_select" style="width: 100%;"></select>
              </div>
              <div style="flex: 1; min-width: 220px;">
                  <label><strong>Table 2:</strong></label><br/>
                  <select class="join_table2_select" style="width: 100%;"></select>
              </div>
              <div style="flex: 1; min-width: 220px;">
                  <label><strong>Table 2 Column:</strong></label><br/>
                  <select class="join_table2_column_select" style="width: 100%;"></select>
              </div>
              <div style="flex: 1; min-width: 220px;">
                  <label><strong>Join Type:</strong></label><br/>
                  <select class="join_type_select" style="width: 100%;">
                      <option value="INNER">Matching Combinations</option>
                      <option value="CROSS">All Possible Combinations</option>
                  </select>
              </div>
              <button class="remove_join_btn" style="position: absolute; top: 5px; right: 5px;">❌</button>
          `;

          dynamicJoinsContainer.appendChild(wrapper);

          // Access raw <select> elements
          const joinTable1Select = wrapper.querySelector('.join_table1_select');
          const joinTable2Select = wrapper.querySelector('.join_table2_select');
          const joinTable1ColumnSelect = wrapper.querySelector('.join_table1_column_select');
          const joinTable2ColumnSelect = wrapper.querySelector('.join_table2_column_select');
          const removeBtn = wrapper.querySelector('.remove_join_btn');

          // Initialize Choices.js on each select
          const table1Choice = new Choices(joinTable1Select, { searchEnabled: true, shouldSort: false });
          const table2Choice = new Choices(joinTable2Select, { searchEnabled: true, shouldSort: false });
          const table1ColChoice = new Choices(joinTable1ColumnSelect, { searchEnabled: true, shouldSort: false });
          const table2ColChoice = new Choices(joinTable2ColumnSelect, { searchEnabled: true, shouldSort: false });

          // Set table options
          const tableChoices = tables.map(t => ({ value: t, label: t }));
          table1Choice.setChoices(tableChoices, 'value', 'label', true);
          table2Choice.setChoices(tableChoices, 'value', 'label', true);

          // Load columns from backend and set to target select
          const updateJoinColumns = async (table, choicesInstance) => {
              const res = await fetch(`/get_columns/?table_name=${encodeURIComponent(table)}`);
              const data = await res.json();
              const columns = data.columns || [];

              const columnOptions = columns.map(col => ({ value: col, label: col }));
              choicesInstance.setChoices(columnOptions, 'value', 'label', true); // true = replace existing
          };

          // When a table is selected, update its column dropdown
          joinTable1Select.addEventListener('change', (e) => {
              updateJoinColumns(e.target.value, table1ColChoice);
          });

          joinTable2Select.addEventListener('change', (e) => {
              updateJoinColumns(e.target.value, table2ColChoice);
          });

          // Trigger once initially
          joinTable1Select.dispatchEvent(new Event('change'));
          joinTable2Select.dispatchEvent(new Event('change'));

          // Handle remove
          removeBtn.addEventListener('click', () => wrapper.remove());
      };

      // First join block by default
      createJoinBlock(0);

      // Add more blocks dynamically
      document.getElementById('add_join_btn').onclick = () => {
          createJoinBlock(Date.now());
      };
  }



  //query submission
  submitQueryBtn.addEventListener('click', async () => {
    // 1. Get selected tables
    const selectedTables = Array.from(tableSelector.selectedOptions).map(opt => opt.value);
    if (!selectedTables.length) {
      alert('⚠️ Please select at least one table.');
      return;
    }

    // 2. Prepare selected output columns
    const outputColumns = {};
    for (const table of selectedTables) {
      if (selectedOutputColumns[table] && selectedOutputColumns[table].length) {
        outputColumns[table] = [...selectedOutputColumns[table]];
      }
    }

    // 3. Prepare conditions array
    const conditions = [];
    Object.entries(selectedConditionColumns).forEach(([table, cols]) => {
      cols.forEach(col => {
        const key = `${table}__${col}`;
        const cond = conditionValuesState[key];
        if (cond) {
          const value = cond.valueMode === 'custom' ? cond.customValue : cond.value;
          if (value !== undefined && value !== '') {
            conditions.push({
              table,
              column: col,
              operator: cond.operator || '=',
              logic: cond.logic || 'AND',
              value: value === '__NULL__' ? null : value,
            });
          }
        }
      });
    });

    // 4. Prepare join conditions
    const joins = [];
    const joinBlocks = document.querySelectorAll('#dynamic_joins_container .join-block');
    joinBlocks.forEach(block => {
      const table1 = block.querySelector('.join_table1_select').value;
      const column1 = block.querySelector('.join_table1_column_select').value;
      const table2 = block.querySelector('.join_table2_select').value;
      const column2 = block.querySelector('.join_table2_column_select').value;
      const joinType = block.querySelector('.join_type_select').value;

      if (table1 && column1 && table2 && column2) {
        joins.push({
          table1,
          column1,
          table2,
          column2,
          joinType,
        });
      }
    });

    // 5. Build query payload object
    const queryPayload = {
      tables: selectedTables,
      outputColumns,
      conditions,
      joins,
    };

    console.log('Submitting query payload:', queryPayload);

    // 6. Send payload to backend
    try {
      const response = await fetch('submit_query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(queryPayload),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const result = await response.json();

      // 7. Display the result in a table
      displayResultTable(result);

    } catch (error) {
      console.error('Error submitting query:', error);
      alert(`Failed to submit query: ${error.message}`);
    }
  });


  function displayResultTable(result) {
    const resultContainer = document.getElementById('result_container');
    resultContainer.innerHTML = ''; // Clear previous results

    if (!result.columns || !result.rows) {
      resultContainer.textContent = 'No results to display.';
      return;
    }

    const table = document.createElement('table');
    table.style.borderCollapse = 'collapse';
    table.style.width = '100%';

    // Table header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    result.columns.forEach(col => {
      const th = document.createElement('th');
      th.textContent = col;
      th.style.border = '1px solid #ddd';
      th.style.padding = '8px';
      th.style.backgroundColor = '#f2f2f2';
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Table body
    const tbody = document.createElement('tbody');
    result.rows.forEach(row => {
      const tr = document.createElement('tr');
      row.forEach(cell => {
        const td = document.createElement('td');
        td.textContent = cell === null ? 'NULL' : cell;
        td.style.border = '1px solid #ddd';
        td.style.padding = '8px';
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    resultContainer.appendChild(table);
  }

});
