import { renderTree, result2Global, tree2ContainerGlobal } from "./sidebar.js";

// viewer.js
export function setupSelectionHandler(viewer, callback) {
  let currentDocId = null;
  const spinner = document.getElementById("loadingSpinner");

  // Definimos los nombres/propiedades de objetos que se puedan seleccionar
  const validTypePresentar = ["Si"];

  // Función para actualizar los atributos
  function updateAttributesPanel(props) {
    const atributosDiv = document.getElementById("atributos");
    const noFichasDiv = document.getElementById("no-fichas");

    if (!atributosDiv || !noFichasDiv) return;

    // 1. Determinar el tipo de elemento por su nombre
    const elementName = props.name || "";
    const normalizedName = elementName
      .normalize("NFD") // Normalizar tildes
      .replace(/[\u0300-\u036f]/g, "") // Eliminar diacríticos
      .toLowerCase();

    // 2. Seleccionar atributos según palabras clave
    let selectedAttributes = {};
    if (normalizedName.includes("poste")) {
      selectedAttributes = {
        Comments: props.properties.find((p) => p.displayName === "Comments")
          ?.displayValue,
        "DOC-ID": props.properties.find((p) => p.displayName === "DOC-ID")
          ?.displayValue,
      };
    } else if (normalizedName.includes("3hp")) {
      selectedAttributes = {
        "NOMBRE AIREADOR": props.properties.find(
          (p) => p.displayName === "NOMBRE AIREADOR"
        )?.displayValue,
        "NOMBRE TA": props.properties.find((p) => p.displayName === "NOMBRE TA")
          ?.displayValue,
        "DOC-ID": props.properties.find((p) => p.displayName === "DOC-ID")
          ?.displayValue,
      };
    } else if (normalizedName.includes("aireadores")) {
      selectedAttributes = {
        "N° AIREADORES": props.properties.find(
          (p) => p.displayName === "N° AIREADORES"
        )?.displayValue,
        "NOMBRE TA": props.properties.find((p) => p.displayName === "NOMBRE TA")
          ?.displayValue,
        "DOC-ID": props.properties.find((p) => p.displayName === "DOC-ID")
          ?.displayValue,
      };
    } else if (normalizedName.includes("compensacion")) {
      // Sin tilde por la normalización
      selectedAttributes = {
        "CAPACIDAD TCP": props.properties.find(
          (p) => p.displayName === "CAPACIDAD TCP"
        )?.displayValue,
        "NOMBRE TCP": props.properties.find(
          (p) => p.displayName === "NOMBRE TCP"
        )?.displayValue,
        "DOC-ID": props.properties.find((p) => p.displayName === "DOC-ID")
          ?.displayValue,
      };
    } else if (normalizedName.includes("transformador")) {
      selectedAttributes = {
        ID: props.properties.find((p) => p.displayName === "ID")?.displayValue,
        "NOMBRE TR": props.properties.find((p) => p.displayName === "NOMBRE TR")
          ?.displayValue,
        "CAPACIDAD TR": props.properties.find(
          (p) => p.displayName === "CAPACIDAD TR"
        )?.displayValue,
        PISCINA: props.properties.find((p) => p.displayName === "PISCINA")
          ?.displayValue,
        MARCA: props.properties.find((p) => p.displayName === "MARCA")
          ?.displayValue,
      };
    }

    // 3. Verificar si hay atributos
    const hasAttributes = Object.values(selectedAttributes).some(
      (value) => value !== undefined && value !== null
    );

    if (hasAttributes) {
      // Generar HTML de atributos
      atributosDiv.innerHTML = `
      <table class="attributes-table">
        <thead>
          <tr>
            <th>Atributo</th>
            <th>Valor</th>
          </tr>
        </thead>
        <tbody>
          ${Object.entries(selectedAttributes)
            .map(
              ([key, value]) => `
              <tr>
                <td class="attribute-key">${key}</td>
                <td class="attribute-value">${value || "N/A"}</td>
              </tr>
            `
            )
            .join("")}
        </tbody>
      </table>
    `;
      // Ocultar el mensaje de "No hay fichas técnicas disponibles" si hay atributos
      noFichasDiv.style.display = "none";
    } else {
      // Mostrar ambos mensajes si no hay atributos
      atributosDiv.innerHTML = `<h3 class="attributes-header">El elemento no tiene atributos</h3>`;
      noFichasDiv.style.display = "block";
    }
  }

  viewer.addEventListener(Autodesk.Viewing.SELECTION_CHANGED_EVENT, (event) => {
    const selection = event.dbIdArray;

    const atributosDiv = document.getElementById("atributos");
    const noFichasDiv = document.getElementById("no-fichas");

    if (selection.length === 0) {
      // Mostrar ambos mensajes si no hay selección
      if (atributosDiv)
        atributosDiv.innerHTML = `<h3 class="attributes-header">El elemento no tiene atributos</h3>`;
      if (noFichasDiv) noFichasDiv.style.display = "block";
      clearTree(); // Limpiar el árbol y las fichas técnicas
      return;
    }

    if (selection.length === 0) return;

    const dbId = selection[0];

    viewer.getProperties(dbId, (props) => {
      const typeName = props.properties.find(
        (prop) => prop.displayName === "PRESENTAR"
      )?.displayValue;

      // Se verifica si el typeName está en la lista de objetos válidos
      if (!validTypePresentar.includes(typeName)) {
        // Mostrar ambos mensajes si el objeto no es válido
        if (atributosDiv)
          atributosDiv.innerHTML = `<h3 class="attributes-header">El elemento no tiene atributos</h3>`;
        if (noFichasDiv) noFichasDiv.style.display = "block";
        clearTree();
        result2Global = null;
        currentDocId = null;
        return;
      }

      updateAttributesPanel(props); // Actualizar panel de atributos

      console.log("pasa el filtro de type name");

      // Extraer objectType y searchAdditional antes de actualizar el panel
      const elementName = props.name || "";
      const normalizedName = elementName
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();

      let docId, additionalFilter;
      if (normalizedName.includes("poste")) {
        docId = props.properties.find(
          (prop) => prop.displayName === "DOC-ID"
        )?.displayValue;
        additionalFilter = null; // No se necesita filtro adicional para 'poste'
      } else if (normalizedName.includes("3hp")) {
        docId = props.properties.find(
          (prop) => prop.displayName === "DOC-ID"
        )?.displayValue;
        additionalFilter = null;
      } else if (normalizedName.includes("aireadores")) {
        docId = props.properties.find(
          (prop) => prop.displayName === "DOC-ID"
        )?.displayValue;
        additionalFilter = props.properties.find(
          (prop) => prop.displayName === "NOMBRE TA"
        )?.displayValue;
      } else if (normalizedName.includes("compensacion")) {
        docId = props.properties.find(
          (prop) => prop.displayName === "DOC-ID"
        )?.displayValue;
        additionalFilter = props.properties.find(
          (prop) => prop.displayName === "NOMBRE TCP"
        )?.displayValue;
      } else if (normalizedName.includes("transformador")) {
        docId = props.properties.find(
          (prop) => prop.displayName === "DOC-ID"
        )?.displayValue;
        additionalFilter = props.properties.find(
          (prop) => prop.displayName === "ID"
        )?.displayValue;
      }

      // Verificar si las propiedades existen
      // Validar que al menos exista DOC-ID o additionalFilter
      if (!docId && additionalFilter === undefined) {
        console.error(
          "No se encontró DOC-ID ni el filtro adicional para el objeto seleccionado."
        );
        return;
      }

      console.log("DOC-ID:", docId);
      console.log("Filtro Adicional:", additionalFilter);

      console.log("docId", docId);
      console.log("props", props);
      console.log("props.name", props.name);

      if (docId || additionalFilter) {
        if (!currentDocId || (docId && !currentDocId.includes(docId))) {
          if (docId) {
            alert(`Nuevo DOC-ID detectado: ${docId}`);
            currentDocId = docId;
          } else {
            alert(`Nuevo filtro adicional detectado: ${additionalFilter}`);
            currentDocId = additionalFilter; // O maneja el valor de otra forma
          }

          if (callback) callback(docId, additionalFilter);

          clearTree();

          if (tree2ContainerGlobal && result2Global) {
            renderTree({
              container: tree2ContainerGlobal,
              items: result2Global,
              viewer: viewer,
              docId: docId,
              additionalFilter: additionalFilter,
            }).finally(() => {
              spinner.style.display = "none";
              if (navItem) {
                navItem.classList.add("active");
                navItem.querySelector(".nav-subitems").style.maxHeight = "none";
              }
            });
          } else {
            console.warn("Datos de initTree no están listos aún.");
          }
        }
      } else {
        alert(
          "El objeto seleccionado no tiene un DOC-ID ni filtro adicional para filtrar."
        );
        currentDocId = null;
        clearTree();
      }
    });
  });
}

export let currentDocId = null;

function clearTree() {
  if (tree2ContainerGlobal) {
    tree2ContainerGlobal.innerHTML = "";
    // Mostrar mensaje de "No hay contenido" al limpiar
    const noContentMsg = document.getElementById("no-fichas");
    if (noContentMsg) {
      noContentMsg.style.display = "block";
    }
    // Resetear estado de renderedIds
    tree2ContainerGlobal.dataset.renderedIds = "[]";
  }
}

async function getAccessToken(callback) {
  try {
    const resp = await fetch("/api/auth/token");
    if (!resp.ok) throw new Error(await resp.text());
    const { access_token, expires_in } = await resp.json();
    callback(access_token, expires_in);
  } catch (err) {
    alert("Could not obtain access token. See the console for more details.");
    console.error(err);
  }
}

class CustomToolExtension extends Autodesk.Viewing.Extension {
  constructor(viewer, options) {
    super(viewer, options);
    this._group = null;
    this._button = null;
  }

  load() {
    console.log("CustomToolExtension se ha cargado");
    return true;
  }

  unload() {
    console.log("CustomToolExtension no se ha podido cargar");

    // Limpiar recursos
    if (this._button) {
      this.removeToolbarButton();
    }
    return true;
  }

  onToolbarCreated(toolbar) {
    // Creamos un grupo de botones adicional en el toolbar
    this._group = new Autodesk.Viewing.UI.ControlGroup("custom-tool-group");

    // Creamos el botón personalizado
    this._button = new Autodesk.Viewing.UI.Button("my-custom-tool-button");
    this._button.onClick = (ev) => {
      // Abrir el modal
      this.openModal();
      this.listObjects();
    };
    this._button.setToolTip("Tabla de objetos");

    // Crear un elemento span para el ícono de Material Icons
    const icon = document.createElement("span");
    icon.className = "material-icons"; // Clase de Material Icons
    icon.innerText = "table_chart"; // Nombre del ícono
    icon.style.fontSize = "24px"; // Tamaño del ícono
    icon.style.color = "black";

    // Aplicar estilos al contenedor del botón
    this._button.container.style.display = "flex"; // Usar flexbox para centrar
    this._button.container.style.alignItems = "center"; // Centrar verticalmente
    this._button.container.style.justifyContent = "center"; // Centrar horizontalmente
    this._button.container.style.borderRadius = "4px"; // Bordes redondeados

    // Agregar el ícono al botón
    this._button.container.appendChild(icon);

    // Agregamos el botón al grupo
    this._group.addControl(this._button);

    // Agregamos el grupo a la barra de herramientas
    toolbar.addControl(this._group);
  }

  openModal() {
    this._modal = document.getElementById("customModal");
    if (this._modal) {
      this._modal.style.display = "block";

      // Agregar eventos para mover el modal
      const header = this._modal.querySelector("div:first-child");
      header.addEventListener("mousedown", (e) => this.startDrag(e));
      document.addEventListener("mousemove", (e) => this.dragModal(e));
      document.addEventListener("mouseup", () => this.stopDrag());

      // Agregar evento para cerrar el modal
      const closeButton = this._modal.querySelector("#closeCustomModal");
      closeButton.addEventListener("click", () => this.closeModal());
    }
  }

  closeModal() {
    if (this._modal) {
      this._modal.style.display = "none";
    }
  }

  startDrag(e) {
    this._isDragging = true;
    const rect = this._modal.getBoundingClientRect();
    this._offsetX = e.clientX - rect.left;
    this._offsetY = e.clientY - rect.top;
  }

  dragModal(e) {
    if (this._isDragging && this._modal) {
      this._modal.style.left = `${e.clientX - this._offsetX}px`;
      this._modal.style.top = `${e.clientY - this._offsetY}px`;
    }
  }

  stopDrag() {
    this._isDragging = false;
  }

  removeToolbarButton() {
    if (this._group && this._button) {
      this._group.removeControl(this._button);
      this._button = null;
    }
  }

  listObjects() {
    const viewer = this.viewer;
    const tableBody = document.querySelector("#objectsTable tbody");
    tableBody.innerHTML = ""; // Limpiar la tabla antes de llenarla

    // Obtener el árbol de objetos del modelo
    viewer.getObjectTree((tree) => {
      if (tree) {
        // Crear un expansible para "poste"
        const posteRow = document.createElement("tr");
        posteRow.innerHTML = `
          <td style="padding: 8px; border-bottom: 1px solid #ccc;">
            Postes
          </td>
          <td style="padding: 8px; border-bottom: 1px solid #ccc;">
            <button class="view-button" data-dbid="poste">Ver elementos</button>
          </td>
        `;
        tableBody.appendChild(posteRow);

        // Agregar evento para mostrar la tabla de postes
        const posteButton = posteRow.querySelector(".view-button");
        posteButton.addEventListener("click", () => {
          this.showFilteredTable(viewer, tree, "poste");
        });

        // Crear un expansible para "aireador 3hp"
        const aireador3hpRow = document.createElement("tr");
        aireador3hpRow.innerHTML = `
          <td style="padding: 8px; border-bottom: 1px solid #ccc;">
            Tableros de Aireación 3hp 460v 3f
          </td>
          <td style="padding: 8px; border-bottom: 1px solid #ccc;">
            <button class="view-button" data-dbid="aireador 3hp">Ver elementos</button>
          </td>
        `;
        tableBody.appendChild(aireador3hpRow);

        // Agregar evento para mostrar la tabla de aireadores
        const aireador3hpButton = aireador3hpRow.querySelector(".view-button");
        aireador3hpButton.addEventListener("click", () => {
          this.showFilteredTable(viewer, tree, "aireador 3hp");
        });

        // Crear un expansible para "aireadores"
        const aireadoresRow = document.createElement("tr");
        aireadoresRow.innerHTML = `
          <td style="padding: 8px; border-bottom: 1px solid #ccc;">
            Tableros de Aireación
          </td>
          <td style="padding: 8px; border-bottom: 1px solid #ccc;">
            <button class="view-button" data-dbid="aireadores">Ver elementos</button>
          </td>
        `;
        tableBody.appendChild(aireadoresRow);

        // Agregar evento para mostrar la tabla de aireadores
        const aireadoresButton = aireadoresRow.querySelector(".view-button");
        aireadoresButton.addEventListener("click", () => {
          this.showFilteredTable(viewer, tree, "aireadores");
        });

        // Crear un expansible para "compensacion"
        const compensacionRow = document.createElement("tr");
        compensacionRow.innerHTML = `
          <td style="padding: 8px; border-bottom: 1px solid #ccc;">
            Tableros de Compensación
          </td>
          <td style="padding: 8px; border-bottom: 1px solid #ccc;">
            <button class="view-button" data-dbid="compensacion">Ver elementos</button>
          </td>
        `;
        tableBody.appendChild(compensacionRow);

        // Agregar evento para mostrar la tabla de compensacion
        const compensacionButton =
          compensacionRow.querySelector(".view-button");
        compensacionButton.addEventListener("click", () => {
          this.showFilteredTable(viewer, tree, "compensacion");
        });

        // Crear un expansible para "transformador"
        const transformadorRow = document.createElement("tr");
        transformadorRow.innerHTML = `
          <td style="padding: 8px; border-bottom: 1px solid #ccc;">
            Transformadores
          </td>
          <td style="padding: 8px; border-bottom: 1px solid #ccc;">
            <button class="view-button" data-dbid="transformador">Ver elementos</button>
          </td>
        `;
        tableBody.appendChild(transformadorRow);

        // Agregar evento para mostrar la tabla de transformador
        const transformadorButton =
          transformadorRow.querySelector(".view-button");
        transformadorButton.addEventListener("click", () => {
          this.showFilteredTable(viewer, tree, "transformador");
        });

        // Crear un expansible para "floor"
        const floorRow = document.createElement("tr");
        floorRow.innerHTML = `
          <td style="padding: 8px; border-bottom: 1px solid #ccc;">
            Tableros de Piscinas
          </td>
          <td style="padding: 8px; border-bottom: 1px solid #ccc;">
            <button class="view-button" data-dbid="floor">Ver elementos</button>
          </td>
        `;
        tableBody.appendChild(floorRow);

        // Agregar evento para mostrar la tabla de floors
        const floorButton = floorRow.querySelector(".view-button");
        floorButton.addEventListener("click", () => {
          this.showFilteredTable(viewer, tree, "floor");
        });
      } else {
        console.warn("No se pudo obtener el árbol de objetos.");
      }
    });
  }

  async showFilteredTable(viewer, tree, filter) {
    // 1. Eliminar modal existente del mismo tipo
    const existingModal = document.getElementById(`${filter}Modal`);
    if (existingModal) {
      existingModal.remove();
    }

    // Definir las cabeceras según el filtro
    let headers = [];
    let searchProperties = [];
    switch (filter) {
      case "poste":
        headers = ["POSTE", "TIPO"];
        searchProperties = ["POSTE", "TIPO"];
        break;
      case "aireador 3hp":
        headers = ["NOMBRE AIREADOR", "NOMBRE TA"];
        searchProperties = ["NOMBRE AIREADOR", "NOMBRE TA"];
        break;
      case "aireadores":
        headers = ["NOMBRE", "N° AIREADORES"];
        searchProperties = ["NOMBRE", "N° AIREADORES"];
        break;
      case "compensacion":
        headers = ["NOMBRE", "CAPACIDAD"];
        searchProperties = ["NOMBRE", "CAPACIDAD"];
        break;
      case "transformador":
        headers = [
          "ID",
          "NOMBRE TRANSFORMADOR",
          "CAPACIDAD KVA",
          "PISCINA",
          "MARCA",
        ];
        searchProperties = [
          "ID",
          "NOMBRE TRANSFORMADOR",
          "CAPACIDAD KVA",
          "PISCINA",
          "MARCA",
        ];
        break;
      case "floor":
        headers = ["Comments", "Type Name"];
        searchProperties = ["Comments", "Type Name"];
        break;
      default:
        headers = ["POSTE", "TIPO"];
        searchProperties = ["POSTE", "TIPO"];
    }

    // Crear el modal para la tabla filtrada
    const filteredModal = document.createElement("div");
    filteredModal.id = `${filter}Modal`;
    filteredModal.style.display = "none";
    filteredModal.style.position = "fixed";
    filteredModal.style.background = "white";
    filteredModal.style.border = "1px solid #ccc";
    filteredModal.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)";
    filteredModal.style.zIndex = "1000";
    filteredModal.style.width = "800px";
    filteredModal.classList.add("resizable");

    // Configuración de redimensionamiento
    let isResizing = false;
    let startX, startY, startWidth, startHeight;

    filteredModal.addEventListener("mousedown", (e) => {
      if (e.target === filteredModal) {
        isResizing = true;
        startX = e.clientX;
        startY = e.clientY;
        startWidth = parseInt(
          document.defaultView.getComputedStyle(filteredModal).width,
          10
        );
        startHeight = parseInt(
          document.defaultView.getComputedStyle(filteredModal).height,
          10
        );
        e.preventDefault();
      }
    });

    document.addEventListener("mousemove", (e) => {
      if (isResizing) {
        filteredModal.style.width = `${startWidth + e.clientX - startX}px`;
        filteredModal.style.height = `${startHeight + e.clientY - startY}px`;
      }
    });

    document.addEventListener("mouseup", () => {
      isResizing = false;
    });

    // Header del modal
    const modalHeader = document.createElement("div");
    modalHeader.style.background = "#f1f1f1";
    modalHeader.style.padding = "10px";
    modalHeader.style.cursor = "move";

    // Contenedor superior para el título y el botón de cierre
    const topContainer = document.createElement("div");
    topContainer.style.display = "flex";
    topContainer.style.justifyContent = "space-between";
    topContainer.style.alignItems = "center";
    topContainer.style.marginBottom = "10px";

    const closeButton = document.createElement("span");
    closeButton.id = `close${filter}Modal`;
    closeButton.style.cursor = "pointer";
    closeButton.textContent = "×";
    closeButton.style.fontWeight = "600";
    closeButton.style.fontSize = "18px";

    const modalTitle = document.createElement("h3");
    modalTitle.style.margin = "0";
    modalTitle.textContent = `Tabla de ${filter}`;

    topContainer.appendChild(modalTitle);
    topContainer.appendChild(closeButton);

    // Contenedor de la barra de búsqueda
    const searchContainer = document.createElement("div");
    searchContainer.style.display = "flex";
    searchContainer.style.alignItems = "center";
    searchContainer.style.gap = "10px";
    searchContainer.style.width = "100%";

    const searchInput = document.createElement("input");
    searchInput.type = "text";
    searchInput.placeholder = "Buscar...";
    searchInput.style.padding = "5px";
    searchInput.style.border = "1px solid #ccc";
    searchInput.style.borderRadius = "4px";
    searchInput.style.flex = "1";

    const filterIcon = document.createElement("span");
    filterIcon.className = "material-icons";
    filterIcon.textContent = "filter_list";
    filterIcon.style.cursor = "pointer";
    filterIcon.style.fontSize = "24px";

    // Crear el menú desplegable de propiedades
    const filterMenu = document.createElement("div");
    filterMenu.style.background = "white";
    filterMenu.style.border = "1px solid #ccc";
    filterMenu.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)";
    filterMenu.style.padding = "10px";
    filterMenu.style.display = "none";
    filterMenu.style.zIndex = "1001";

    searchProperties.forEach((prop) => {
      const propContainer = document.createElement("div");
      propContainer.style.display = "flex";
      propContainer.style.alignItems = "center";
      propContainer.style.gap = "5px";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = true;
      checkbox.value = prop;

      const label = document.createElement("label");
      label.textContent = prop;

      propContainer.appendChild(checkbox);
      propContainer.appendChild(label);
      filterMenu.appendChild(propContainer);
    });

    // Mostrar/ocultar el menú de propiedades
    filterIcon.addEventListener("click", (e) => {
      e.stopPropagation();
      filterMenu.style.display =
        filterMenu.style.display === "none" ? "block" : "none";
    });

    // Cerrar el menú al hacer clic fuera
    document.addEventListener("click", (e) => {
      if (!filterMenu.contains(e.target)) {
        filterMenu.style.display = "none";
      }
    });

    searchContainer.appendChild(searchInput);
    searchContainer.appendChild(filterIcon);
    searchContainer.appendChild(filterMenu);

    // Agregar los contenedores al header
    modalHeader.appendChild(topContainer);
    modalHeader.appendChild(searchContainer);

    // Cuerpo del modal
    const modalBody = document.createElement("div");
    modalBody.style.padding = "20px";
    modalBody.style.maxHeight = "85vh";
    modalBody.style.overflowY = "auto";

    // Loading spinner
    const spinnerContainer = document.createElement("div");
    spinnerContainer.className = "loading-spinner";
    spinnerContainer.innerHTML = '<div class="spinner"></div>';

    // Tabla
    const filteredTable = document.createElement("table");
    filteredTable.id = `${filter}Table`;
    filteredTable.style.width = "100%";
    filteredTable.style.borderCollapse = "collapse";
    filteredTable.style.display = "none"; // Ocultar inicialmente

    const tableHead = document.createElement("thead");
    tableHead.innerHTML = `
        <tr>
            ${headers
              .map(
                (header) =>
                  `<th style="padding: 8px; border-bottom: 1px solid #ccc;">${header}</th>`
              )
              .join("")}
            <th style="padding: 8px; border-bottom: 1px solid #ccc;">Acción</th>
        </tr>
    `;

    const tableBody = document.createElement("tbody");
    tableBody.innerHTML = ""; // Limpiar contenido inicial

    filteredTable.appendChild(tableHead);
    filteredTable.appendChild(tableBody);

    // Ensamblar componentes
    modalBody.appendChild(spinnerContainer);
    modalBody.appendChild(filteredTable);
    filteredModal.appendChild(modalHeader);
    filteredModal.appendChild(modalBody);
    document.body.appendChild(filteredModal);

    // Configurar eventos de UI
    let isDragging = false;
    let offsetX, offsetY;

    modalHeader.addEventListener("mousedown", (e) => {
      isDragging = true;
      offsetX = e.clientX - filteredModal.offsetLeft;
      offsetY = e.clientY - filteredModal.offsetTop;
    });

    document.addEventListener("mousemove", (e) => {
      if (isDragging) {
        filteredModal.style.left = `${e.clientX - offsetX}px`;
        filteredModal.style.top = `${e.clientY - offsetY}px`;
      }
    });

    document.addEventListener("mouseup", () => {
      isDragging = false;
    });

    closeButton.addEventListener("click", () => {
      filteredModal.remove();
    });

    // Función para filtrar la tabla
    const filterTable = () => {
      const searchText = searchInput.value.toLowerCase();
      const checkboxes = filterMenu.querySelectorAll("input[type='checkbox']");
      const selectedProperties = Array.from(checkboxes)
        .filter((checkbox) => checkbox.checked)
        .map((checkbox) => checkbox.value);

      const rows = tableBody.querySelectorAll("tr");
      rows.forEach((row) => {
        const cells = row.querySelectorAll("td");
        let match = false;
        cells.forEach((cell, index) => {
          if (selectedProperties.includes(headers[index])) {
            if (cell.textContent.toLowerCase().includes(searchText)) {
              match = true;
            }
          }
        });
        row.style.display = match ? "" : "none";
      });
    };

    searchInput.addEventListener("input", filterTable);
    filterMenu
      .querySelectorAll("input[type='checkbox']")
      .forEach((checkbox) => {
        checkbox.addEventListener("change", filterTable);
      });

    try {
      // Mostrar estados iniciales
      filteredModal.style.display = "block";
      spinnerContainer.style.display = "flex";

      // Cargar datos
      await this.fillFilteredTable(viewer, tree, tableBody, filter);
    } catch (error) {
      console.error("Error al cargar datos:", error);
      tableBody.innerHTML = `<tr><td colspan="${
        headers.length + 1
      }">Error cargando datos</td></tr>`;
    } finally {
      // Ocultar spinner y mostrar tabla
      spinnerContainer.remove();
      filteredTable.style.display = "table";
    }
  }

  async fillFilteredTable(viewer, tree, tableBody, filter) {
    const rootId = tree.getRootId();
    await this.findAndDisplayFilteredObjects(
      viewer,
      tree,
      rootId,
      tableBody,
      filter
    );
  }

  async findAndDisplayFilteredObjects(
    viewer,
    tree,
    dbId,
    container,
    filter,
    processedIds = new Set()
  ) {
    // Array para recolectar todos los elementos antes de ordenar
    const itemsCollector = [];

    // Función interna recursiva para recolectar elementos
    const collectItems = async (currentDbId) => {
      const children = [];
      tree.enumNodeChildren(currentDbId, (childDbId) => {
        children.push(childDbId);
      });

      for (const childDbId of children) {
        if (processedIds.has(childDbId)) continue;
        processedIds.add(childDbId);

        const props = await new Promise((resolve) => {
          viewer.getProperties(childDbId, resolve);
        });

        const childName = props.name || "Sin nombre";
        const normalizedName = childName
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase();

        const presentar = props.properties.find(
          (prop) => prop.displayName === "PRESENTAR"
        )?.displayValue;

        if (normalizedName.includes(filter) && presentar === "Si") {
          // Extraer propiedades según el filtro
          const properties = this.extractProperties(props, filter);

          // Extraer número del DOC-ID (asumiendo que es la primera propiedad)
          const docId = properties[0];
          const sortKey = parseInt(docId.match(/\d+/)?.[0] || 0);

          itemsCollector.push({
            dbId: childDbId,
            properties,
            sortKey,
          });
        }

        // Procesar hijos recursivamente
        await collectItems(childDbId);
      }
    };

    // Ejecutar recolección
    await collectItems(dbId);

    // Ordenar elementos por sortKey numérico
    itemsCollector.sort((a, b) => a.sortKey - b.sortKey);

    // Generar filas en orden numérico
    for (const item of itemsCollector) {
      const row = document.createElement("tr");
      row.innerHTML = `
            ${item.properties
              .map(
                (prop) =>
                  `<td style="padding: 8px; border-bottom: 1px solid #ccc;">${prop}</td>`
              )
              .join("")}
            <td style="padding: 8px; border-bottom: 1px solid #ccc;">
                <button class="view-button" data-dbid="${
                  item.dbId
                }">Navegar</button>
            </td>
        `;

      // Agregar evento de clic
      row.querySelector(".view-button").addEventListener("click", () => {
        this.focusOnObject(viewer, item.dbId);
        // Resaltar fila seleccionada
        // Cambiar clase a 'selected-row'
        container
          .querySelectorAll("tr")
          .forEach((r) => r.classList.remove("selected-row"));
        row.classList.add("selected-row");
      });

      container.appendChild(row);
    }
  }

  // Función auxiliar para extraer propiedades
  extractProperties(props, filter) {
    switch (filter) {
      case "poste":
        return [
          props.properties.find((p) => p.displayName === "DOC-ID")
            ?.displayValue || "N/A",
          props.properties.find((p) => p.displayName === "Comments")
            ?.displayValue || "N/A",
        ];
      case "aireador 3hp":
        return [
          props.properties.find((p) => p.displayName === "NOMBRE AIREADOR")
            ?.displayValue || "N/A",
          props.properties.find((p) => p.displayName === "NOMBRE TA")
            ?.displayValue || "N/A",
        ];
      case "aireadores":
        return [
          props.properties.find((p) => p.displayName === "NOMBRE TA")
            ?.displayValue || "N/A",
          props.properties.find((p) => p.displayName === "N° AIREADORES")
            ?.displayValue || "N/A",
        ];
      case "compensacion":
        return [
          props.properties.find((p) => p.displayName === "NOMBRE TCP")
            ?.displayValue || "N/A",
          props.properties.find((p) => p.displayName === "CAPACIDAD TCP")
            ?.displayValue || "N/A",
        ];
      case "transformador":
        return [
          props.properties.find((p) => p.displayName === "ID")?.displayValue ||
            "N/A",
          props.properties.find((p) => p.displayName === "NOMBRE TR")
            ?.displayValue || "N/A",
          props.properties.find((p) => p.displayName === "CAPACIDAD TR")
            ?.displayValue || "N/A",
          props.properties.find((p) => p.displayName === "PISCINA")
            ?.displayValue || "N/A",
          props.properties.find((p) => p.displayName === "MARCA")
            ?.displayValue || "N/A",
        ];
      case "floor":
        return [
          props.properties.find((p) => p.displayName === "Comments")
            ?.displayValue || "N/A",
          props.properties.find((p) => p.displayName === "Type Name")
            ?.displayValue || "N/A",
        ];
      default:
        return ["N/A", "N/A"];
    }
  }

  toggleChildren(row, dbId, tree) {
    const viewer = this.viewer;

    // Obtener el ícono de despliegue
    const toggleIcon = row.querySelector(".toggle-icon");

    // Alternar la clase 'expanded'
    toggleIcon.classList.toggle("expanded");

    // Verificar si ya se han cargado los hijos
    if (row.dataset.childrenLoaded) {
      // Si ya están cargados, solo alternar la visibilidad
      const childrenContainer = row.nextElementSibling;
      childrenContainer.style.display =
        childrenContainer.style.display === "none" ? "block" : "none";
      return;
    }

    // Marcar que los hijos se están cargando
    row.dataset.childrenLoaded = true;

    // Crear un contenedor para los hijos
    const childrenContainer = document.createElement("tr");
    childrenContainer.innerHTML = `
      <td colspan="3" style="padding-left: 20px;">
        <div class="children-container"></div>
      </td>
    `;
    childrenContainer.style.display = "none"; // Ocultar inicialmente

    // Insertar el contenedor de hijos después de la fila actual
    row.parentNode.insertBefore(childrenContainer, row.nextSibling);

    // Obtener los hijos del objeto actual
    const childrenDiv = childrenContainer.querySelector(".children-container");
    tree.enumNodeChildren(dbId, (childDbId) => {
      viewer.getProperties(childDbId, (childProps) => {
        const childName = childProps.name || "Sin nombre";
        const hasChildren = tree.getChildCount(childDbId) > 0; // Verificar si tiene hijos

        // Crear una fila para el hijo
        const childRow = document.createElement("div");
        childRow.innerHTML = `
          <div style="padding: 4px;">
            ${
              hasChildren
                ? '<span class="toggle-icon" style="cursor: pointer; margin-right: 8px;">▶</span>'
                : ""
            }
            <span>${childName}</span>
            <button class="view-button" data-dbid="${childDbId}" style="margin-left: 10px;">Ver</button>
          </div>
        `;
        childrenDiv.appendChild(childRow);

        // Agregar evento para expandir/contraer subhijos (solo si tiene hijos)
        if (hasChildren) {
          const childToggleIcon = childRow.querySelector(".toggle-icon");
          childToggleIcon.addEventListener("click", () => {
            this.toggleChildren(childRow, childDbId, tree);
          });
        }

        // Agregar evento para centrar el objeto en el visor
        const viewButton = childRow.querySelector(".view-button");
        viewButton.addEventListener("click", () => {
          this.focusOnObject(viewer, childDbId);
        });
      });
    });

    // Mostrar el contenedor de hijos
    childrenContainer.style.display = "block";
  }

  focusOnObject(viewer, dbId) {
    // Guardar la selección actual
    const currentSelection = viewer.getSelection();
    viewer.fitToView([dbId]);
  }
}

// Registrar la nueva extensión
Autodesk.Viewing.theExtensionManager.registerExtension(
  "CustomToolExtension",
  CustomToolExtension
);

export function initViewer(container) {
  return new Promise(function (resolve, reject) {
    Autodesk.Viewing.Initializer(
      { env: "AutodeskProduction", getAccessToken },
      function () {
        const config = {
          extensions: [
            "Autodesk.DocumentBrowser",
            "Autodesk.Viewing.MarkupsCore",
            "CustomToolExtension",
          ],
        };
        const viewer = new Autodesk.Viewing.GuiViewer3D(container, config);
        viewer.start();
        viewer.setTheme("light-theme");

        // Desactivar eventos de puntero en el canvas
        const canvas = viewer.canvas;
        if (canvas) {
          canvas.style.pointerEvents = "none";
        }

        resolve(viewer);
      }
    );
  });
}

export function loadModel(viewer, urn) {
  function onDocumentLoadSuccess(doc) {
    viewer
      .loadDocumentNode(doc, doc.getRoot().getDefaultGeometry())
      .then(() => {
        // Esperar a que la geometría esté completamente cargada
        viewer.addEventListener(
          Autodesk.Viewing.GEOMETRY_LOADED_EVENT,
          () => {
            // Llamar a la función para filtrar objetos con PRESENTAR = Si
            filterObjectsByPresentar(viewer);
          },
          { once: true } // Asegura que el evento solo se ejecute una vez
        );
      });
  }
  function onDocumentLoadFailure(code, message) {
    alert("Could not load model. See console for more details.");
    console.error(message);
  }
  Autodesk.Viewing.Document.load(
    "urn:" + urn,
    onDocumentLoadSuccess,
    onDocumentLoadFailure
  );
}

function filterObjectsByPresentar(viewer) {
  const validTypePresentar = ["Si"];
  const instanceTree = viewer.model.getData().instanceTree;
  const fragList = viewer.model.getFragmentList();

  // Eliminamos etiquetas anteriores
  const existingLabels = viewer.container.querySelectorAll(".presentar-label");
  existingLabels.forEach((label) => label.remove());
  viewer.clearThemingColors(viewer.model);

  // Obtenemos todos los dbIds del modelo
  const dbIdArray = Object.keys(instanceTree.nodeAccess.dbIdToIndex).map(
    Number
  );

  // Obtenemos propiedades en bloque para evitar múltiples peticiones
  viewer.model.getBulkProperties(
    dbIdArray,
    [
      "PRESENTAR",
      "DOC-ID",
      "NOMBRE AIREADOR",
      "NOMBRE TA",
      "NOMBRE TCP",
      "NOMBRE TR",
      "Type Name",
      "Comments",
      "name",
    ],
    (results) => {
      const objectsToShow = [];
      const objectsToDim = [];

      results.forEach((props) => {
        const presentar = props.properties.find(
          (p) => p.displayName === "PRESENTAR"
        )?.displayValue;

        // Clasificar objetos en dos grupos
        if (validTypePresentar.includes(presentar)) {
          // Objeto permitido
          const docId =
            props.properties.find((p) => p.displayName === "DOC-ID")
              ?.displayValue || "Sin DOC-ID";
          const nombreAireador =
            props.properties.find((p) => p.displayName === "NOMBRE AIREADOR")
              ?.displayValue || "Sin NOMBRE AIREADOR";
          const nombreTA =
            props.properties.find((p) => p.displayName === "NOMBRE TA")
              ?.displayValue || "Sin NOMBRE TA";
          const nombreTCP =
            props.properties.find((p) => p.displayName === "NOMBRE TCP")
              ?.displayValue || "Sin NOMBRE TCP";
          const nombreTR =
            props.properties.find((p) => p.displayName === "NOMBRE TR")
              ?.displayValue || "Sin NOMBRE TR";
          const commentsFloor =
            props.properties.find((p) => p.displayName === "Comments")
              ?.displayValue || "Sin propiedad Comments";
          let box = new THREE.Box3();

          const elementName = props.name || "";
          const normalizedName = elementName
            .normalize("NFD") // Normalizamos tildes
            .replace(/[\u0300-\u036f]/g, "") // Eliminamos diacríticos
            .toLowerCase();

          instanceTree.enumNodeFragments(props.dbId, (fragId) => {
            let fragBox = new THREE.Box3();
            fragList.getWorldBounds(fragId, fragBox);
            box.union(fragBox);
          });

          if (!box.isEmpty()) {
            let labelText = "";

            if (normalizedName.includes("poste")) {
              labelText = docId;
            } else if (normalizedName.includes("3hp")) {
              labelText = nombreAireador;
            } else if (normalizedName.includes("aireadores")) {
              labelText = nombreTA;
            } else if (normalizedName.includes("compensacion")) {
              labelText = nombreTCP;
            } else if (normalizedName.includes("transformador")) {
              labelText = nombreTR;
            } else if (normalizedName.includes("floor")) {
              labelText = commentsFloor;
            }
            objectsToShow.push({
              dbId: props.dbId,
              center: box.getCenter(new THREE.Vector3()),
              boxSize: box.getSize(new THREE.Vector3()),
              label: createLabel(labelText, viewer),
            });
          }
        } else {
          // Objeto sin la propiedad "Si"
          objectsToDim.push(props.dbId);
        }
      });

      // Aplicar color atenuado a los objetos sin PRESENTAR = Si
      // (si bien se aplica un color dim, lo que haremos es evitar que se resalten
      // mediante eventos de interacción)
      const dimColor = new THREE.Vector4(0.6, 0.6, 0.6, 0.52);
      objectsToDim.forEach((dbId) => {
        viewer.setThemingColor(dbId, dimColor, viewer.model);
      });

      // Aplicar color vibrante a los objetos con PRESENTAR = 'Si'
      const vibrantColor = new THREE.Vector4(0.95, 0.95, 0.95, 1);
      objectsToShow.forEach((obj) => {
        viewer.setThemingColor(obj.dbId, vibrantColor, viewer.model);
      });

      function createLabel(text, viewer) {
        const label = document.createElement("div");
        label.className = "presentar-label";
        label.textContent = text;
        label.style.position = "absolute";
        label.style.color = "black";
        label.style.border = "2px solid rgba(255, 255, 255, 0.5)";
        label.style.padding = "4px 6px";
        label.style.borderRadius = "50%";
        label.style.pointerEvents = "none";
        label.style.fontSize = "0.85rem";
        label.style.backgroundColor = "rgba(255, 255, 255, 0.2)";
        label.style.boxShadow =
          "inset 0 0 10px rgba(255, 255, 255, 0.3), 0 4px 8px rgba(0, 0, 0, 0.2)";
        label.style.display = "none";

        viewer.container.appendChild(label);
        return label;
      }

      function updateLabels() {
        const viewerWidth = viewer.container.clientWidth;
        const viewerHeight = viewer.container.clientHeight;

        objectsToShow.forEach((obj) => {
          const screenPos = viewer.worldToClient(obj.center);
          const screenBoxSize = viewer.worldToClient(
            obj.boxSize.clone().add(obj.center)
          );

          const screenWidth = Math.abs(screenBoxSize.x - screenPos.x);
          const screenHeight = Math.abs(screenBoxSize.y - screenPos.y);

          if (
            screenWidth > viewerWidth * 0.03 ||
            screenHeight > viewerHeight * 0.03
          ) {
            obj.label.style.display = "block";
            obj.label.style.left = `${screenPos.x}px`;
            obj.label.style.top = `${screenPos.y}px`;
          } else {
            obj.label.style.display = "none";
          }
        });
      }

      // Optimizamos con throttle (evita actualizaciones excesivas)
      let lastUpdate = 0;
      function throttledUpdateLabels() {
        const now = performance.now();
        if (now - lastUpdate > 30) {
          lastUpdate = now;
          updateLabels();
        }
      }

      viewer.addEventListener(
        Autodesk.Viewing.CAMERA_CHANGE_EVENT,
        throttledUpdateLabels
      );

      // Llamada inicial
      updateLabels();

      // --- NUEVO: Filtrado de interacción para objetos sin "PRESENTAR = Si" ---

      // Arreglo de dbIds permitidos (con PRESENTAR = 'Si')
      const allowedIds = objectsToShow.map((obj) => obj.dbId);

      // Interceptamos la selección para descartar objetos no permitidos
      viewer.addEventListener(
        Autodesk.Viewing.SELECTION_CHANGED_EVENT,
        (event) => {
          // Si la selección incluye algún objeto que no esté en allowedIds, la limpiamos
          const filtered = event.dbIdArray.filter((id) =>
            allowedIds.includes(id)
          );
          if (filtered.length !== event.dbIdArray.length) {
            viewer.clearSelection();
          }
        }
      );

      // Interceptamos el hover para que si el objeto sobre el que se pasa el mouse no es permitido, se limpie el resaltado
      viewer.addEventListener(Autodesk.Viewing.HOVER_EVENT, (event) => {
        if (event.dbId && !allowedIds.includes(event.dbId)) {
          viewer.impl.clearHighlight();
        }
      });
    }
  );
}

// Abrir modal
function openModal() {
  document.getElementById("modelModal").style.display = "block";
}

// Cerrar modal
function closeModal() {
  document.getElementById("modelModal").style.display = "none";
}

export function loadModel2(viewer, urn) {
  const thumbnailsContainer = document.getElementById('pdfThumbnails');
  
  document.querySelector('#closeModalBtn').addEventListener('click', () => {
    closeModal();
    thumbnailsContainer.innerHTML = ''; // Limpiar miniaturas al cerrar
  });

  // Evento de click en botón de cierre
  document
    .querySelector('#closeModalBtn')
    .addEventListener('click', closeModal);

  function onDocumentLoadSuccess(doc) {
    const rootItem = doc.getRoot();
    const pdfPages = rootItem.search({ type: 'geometry', role: '2d' }, true);

    console.log('Este PDF tiene', pdfPages.length, 'páginas.');
    console.log('PDF', pdfPages);

    // Abre el modal (tal como ya lo haces)
    openModal();

    Autodesk.Viewing.Initializer(
      {
        env: 'AutodeskProduction',
        getAccessToken,
      },
      function () {
        const options = {
          // Agregamos la extensión del DocumentBrowser
          extensions: [],
        };

        // Creamos el visor en tu contenedor
        viewer = new Autodesk.Viewing.GuiViewer3D(
          document.getElementById('viewerContainer'),
          options
        );
        viewer.start();

        // Cargamos la geometría principal
        viewer
          .loadDocumentNode(doc, doc.getRoot().getDefaultGeometry())
          .then(() => {
            // Aquí forzamos la visibilidad del DocumentBrowser si es que no aparece automáticamente:
            viewer
              .loadExtension('Autodesk.DocumentBrowser')
              

            // Llamamos a la función para capturar las imágenes de cada página
            capturePdfPages(doc, viewer);
          });
      }
    );
  }

  function onDocumentLoadFailure(code, message) {
    alert('Could not load model. See console for more details.');
    console.error(message);
  }

  // Cargamos el modelo desde Autodesk Forge
  Autodesk.Viewing.Document.load(
    'urn:' + urn,
    onDocumentLoadSuccess,
    onDocumentLoadFailure
  );
}


// 🔹 Función para capturar imágenes de cada página del PDF
// En viewer.js, modificar la función capturePdfPages
function capturePdfPages(doc, viewer) {
  const rootItem = doc.getRoot();
  const pdfPages = rootItem.search({ type: 'geometry', role: '2d' }, true);
  const thumbnailsContainer = document.getElementById('pdfThumbnails');
  
  let images = [];

  // Función para capturar una página específica
  function capturePage(page, index) {
    return viewer.loadDocumentNode(doc, page).then(() => {
      return new Promise((resolve) => {
        viewer.getScreenShot(200, 200, (imageData) => {
          images.push({ 
            page: index + 1, 
            image: imageData,
            node: page
          });
          resolve();
        });
      });
    });
  }

  // Capturar todas las páginas en paralelo
  Promise.all(pdfPages.map((page, index) => capturePage(page, index)))
    .then(() => {
      console.log('Captura de todas las páginas completada.');
      renderThumbnails(images);
    })
    .catch((error) => {
      console.error('Error al capturar las páginas:', error);
    });

  function renderThumbnails(images) {
    thumbnailsContainer.innerHTML = '';
    images.forEach((img, index) => {
      const thumbnail = document.createElement('div');
      thumbnail.style.position = 'relative';
      thumbnail.style.marginBottom = '10px';
      thumbnail.style.cursor = 'pointer';
      thumbnail.style.border = '2px solid transparent';
      thumbnail.innerHTML = `
        <img src="${img.image}" 
             style="width: 100%; 
                    height: auto;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                    transition: transform 0.2s;"
             onmouseover="this.style.transform='scale(1.02)'"
             onmouseout="this.style.transform='scale(1)'">
        <div style="position: absolute; bottom: 5px; right: 5px; 
                    background: rgba(0,0,0,0.7); color: white; 
                    padding: 2px 6px; border-radius: 3px;
                    font-size: 12px;">
          ${index + 1}
        </div>
      `;
      
      thumbnail.addEventListener('click', () => {
        // Remover borde de todas las miniaturas
        document.querySelectorAll('#pdfThumbnails div').forEach(t => {
          t.style.borderColor = 'transparent';
        });
        // Resaltar miniatura seleccionada
        thumbnail.style.borderColor = '#2196F3';
        // Cargar la página seleccionada
        viewer.loadDocumentNode(doc, img.node);
      });
      
      thumbnailsContainer.appendChild(thumbnail);
    });
    
    // Seleccionar primera miniatura por defecto
    if (images.length > 0) {
      thumbnailsContainer.firstChild.click();
    }
  }
}