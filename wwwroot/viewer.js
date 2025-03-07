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

      const docId = props.properties.find(
        (prop) => prop.displayName === "DOC-ID"
      )?.displayValue;

      console.log("docId", docId);
      console.log("props", props);
      console.log("props.name", props.name);

      if (docId) {
        if (!currentDocId || !currentDocId.includes(docId)) {
          alert(`Nuevo DOC-ID detectado: ${docId}`);
          currentDocId = docId;

          if (callback) callback(docId);

          clearTree();

          if (tree2ContainerGlobal && result2Global) {
            // Activar el contenedor padre
            const navItem = tree2ContainerGlobal.closest(".nav-item");
            if (navItem) {
              navItem.classList.add("active");
            }
            spinner.style.display = "block";
            renderTree({
              container: tree2ContainerGlobal,
              items: result2Global,
              viewer: viewer,
              docId: docId, // Usa el nuevo DOC-ID
            }).finally(() => {
              // Ocultar spinner y asegurar despliegue
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
        alert("El objeto seleccionado no tiene un DOC-ID para filtrar.");
        currentDocId = null;
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
            poste
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
  
        // Crear un expansible para "aireadores"
        const aireadoresRow = document.createElement("tr");
        aireadoresRow.innerHTML = `
          <td style="padding: 8px; border-bottom: 1px solid #ccc;">
            aireadores
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
            compensacion
          </td>
          <td style="padding: 8px; border-bottom: 1px solid #ccc;">
            <button class="view-button" data-dbid="compensacion">Ver elementos</button>
          </td>
        `;
        tableBody.appendChild(compensacionRow);
  
        // Agregar evento para mostrar la tabla de compensacion
        const compensacionButton = compensacionRow.querySelector(".view-button");
        compensacionButton.addEventListener("click", () => {
          this.showFilteredTable(viewer, tree, "compensacion");
        });
  
        // Crear un expansible para "transformador"
        const transformadorRow = document.createElement("tr");
        transformadorRow.innerHTML = `
          <td style="padding: 8px; border-bottom: 1px solid #ccc;">
            transformador
          </td>
          <td style="padding: 8px; border-bottom: 1px solid #ccc;">
            <button class="view-button" data-dbid="transformador">Ver elementos</button>
          </td>
        `;
        tableBody.appendChild(transformadorRow);
  
        // Agregar evento para mostrar la tabla de transformador
        const transformadorButton = transformadorRow.querySelector(".view-button");
        transformadorButton.addEventListener("click", () => {
          this.showFilteredTable(viewer, tree, "transformador");
        });
      } else {
        console.warn("No se pudo obtener el árbol de objetos.");
      }
    });
  }

  showFilteredTable(viewer, tree, filter) {
    // Definir las cabeceras según el filtro
    let headers = [];
    switch (filter) {
      case "poste":
        headers = ["POSTE", "TIPO"];
        break;
      case "aireadores":
        headers = ["NOMBRE", "N° AIREADORES"];
        break;
      case "compensacion":
        headers = ["NOMBRE", "CAPACIDAD"];
        break;
      case "transformador":
        headers = [
          "ID",
          "NOMBRE TRANSFORMADOR",
          "CAPACIDAD KVA",
          "PISCINA",
          "MARCA",
        ];
        break;
      default:
        headers = ["POSTE", "TIPO"];
    }

    // Crear el modal para la tabla filtrada
    const filteredModal = document.createElement("div");
    filteredModal.id = `${filter}Modal`;
    filteredModal.style.display = "none";
    filteredModal.style.position = "fixed";
    filteredModal.style.top = "50px";
    filteredModal.style.left = "50px";
    filteredModal.style.background = "white";
    filteredModal.style.border = "1px solid #ccc";
    filteredModal.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)";
    filteredModal.style.zIndex = "1000";
    filteredModal.style.width = "800px";
    filteredModal.classList.add("resizable");

    let isResizing = false;
  let startX, startY, startWidth, startHeight;

  filteredModal.addEventListener("mousedown", (e) => {
    if (e.target === filteredModal) {
      isResizing = true;
      startX = e.clientX;
      startY = e.clientY;
      startWidth = parseInt(document.defaultView.getComputedStyle(filteredModal).width, 10);
      startHeight = parseInt(document.defaultView.getComputedStyle(filteredModal).height, 10);
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

  // Agregar el modal al body del documento
  document.body.appendChild(filteredModal);

  // Mostrar el modal
  filteredModal.style.display = "block";

    // Header del modal con botón de cierre
    const modalHeader = document.createElement("div");
    modalHeader.style.background = "#f1f1f1";
    modalHeader.style.padding = "10px";
    modalHeader.style.cursor = "move";
    modalHeader.style.display = "flex"; // Añade display flex
    modalHeader.style.justifyContent = "space-between"; // Alinea los elementos a los extremos
    modalHeader.style.alignItems = "center"; // Centra verticalmente los elementos

    const closeButton = document.createElement("span");
    closeButton.id = `close${filter}Modal`;
    closeButton.style.cursor = "pointer";
    closeButton.textContent = "×";
    closeButton.style.overflowY = "auto";
    closeButton.style.fontWeight = "600";
    closeButton.style.fontSize = "18px";

    const modalTitle = document.createElement("h3");
    modalTitle.style.margin = "0";
    modalTitle.textContent = `Tabla de ${filter}`;

    modalHeader.appendChild(modalTitle);
    modalHeader.appendChild(closeButton);

    // Cuerpo del modal con la tabla
    const modalBody = document.createElement("div");
    modalBody.style.padding = "20px";
    modalBody.style.maxHeight = "85vh";
    modalBody.style.overflowY = "auto";

    const filteredTable = document.createElement("table");
    filteredTable.id = `${filter}Table`;
    filteredTable.style.width = "100%";
    filteredTable.style.borderCollapse = "collapse";
    filteredTable.style.maxHeight = "100%";

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

    filteredTable.appendChild(tableHead);
    filteredTable.appendChild(tableBody);
    modalBody.appendChild(filteredTable);

    // Agregar header y body al modal
    filteredModal.appendChild(modalHeader);
    filteredModal.appendChild(modalBody);

    // Agregar el modal al body del documento
    document.body.appendChild(filteredModal);

    // Mostrar el modal
    filteredModal.style.display = "block";

    // Llenar la tabla con los objetos que contienen el filtro
    this.fillFilteredTable(viewer, tree, tableBody, filter);

    // Agregar funcionalidad de arrastrar
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

    // Agregar funcionalidad de cerrar
    closeButton.addEventListener("click", () => {
      filteredModal.style.display = "none";
    });
  }

  fillFilteredTable(viewer, tree, tableBody, filter) {
    const rootId = tree.getRootId();
    this.findAndDisplayFilteredObjects(viewer, tree, rootId, tableBody, filter);
  }

  findAndDisplayFilteredObjects(viewer, tree, dbId, container, filter) {
    tree.enumNodeChildren(dbId, (childDbId) => {
      viewer.getProperties(childDbId, (childProps) => {
        const childName = childProps.name || "Sin nombre";
        const normalizedName = childName
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase();
  
        if (normalizedName.includes(filter)) {
          let properties = [];
  
          // Determinar qué propiedades mostrar según el filtro
          switch (filter) {
            case "poste":
              properties.push(
                childProps.properties.find(
                  (prop) => prop.displayName === "DOC-ID"
                )?.displayValue || "N/A"
              );
              properties.push(
                childProps.properties.find(
                  (prop) => prop.displayName === "Comments"
                )?.displayValue || "N/A"
              );
              break;
            case "aireadores":
              properties.push(
                childProps.properties.find(
                  (prop) => prop.displayName === "NOMBRE TA"
                )?.displayValue || "N/A"
              );
              properties.push(
                childProps.properties.find(
                  (prop) => prop.displayName === "N° AIREADORES"
                )?.displayValue || "N/A"
              );
              break;
            case "compensacion":
              properties.push(
                childProps.properties.find(
                  (prop) => prop.displayName === "NOMBRE TCP"
                )?.displayValue || "N/A"
              );
              properties.push(
                childProps.properties.find(
                  (prop) => prop.displayName === "CAPACIDAD TCP"
                )?.displayValue || "N/A"
              );
              break;
            case "transformador":
              properties.push(
                childProps.properties.find((prop) => prop.displayName === "ID")
                  ?.displayValue || "N/A"
              );
              properties.push(
                childProps.properties.find(
                  (prop) => prop.displayName === "NOMBRE TR"
                )?.displayValue || "N/A"
              );
              properties.push(
                childProps.properties.find(
                  (prop) => prop.displayName === "CAPACIDAD TR"
                )?.displayValue || "N/A"
              );
              properties.push(
                childProps.properties.find(
                  (prop) => prop.displayName === "PISCINA"
                )?.displayValue || "N/A"
              );
              properties.push(
                childProps.properties.find(
                  (prop) => prop.displayName === "MARCA"
                )?.displayValue || "N/A"
              );
              break;
            default:
              properties.push("N/A");
              properties.push("N/A");
          }
  
          // Crear una fila para el objeto
          const row = document.createElement("tr");
          row.innerHTML = `
            ${properties
              .map(
                (prop) =>
                  `<td style="padding: 8px; border-bottom: 1px solid #ccc;">${prop}</td>`
              )
              .join("")}
            <td style="padding: 8px; border-bottom: 1px solid #ccc;">
              <button class="view-button" data-dbid="${childDbId}">Navegar</button>
            </td>
          `;
          container.appendChild(row);
  
          // Agregar evento para centrar el objeto en el visor y subrayar la fila
          const viewButton = row.querySelector(".view-button");
          viewButton.addEventListener("click", () => {
            // Remover la clase 'selected-row' de todas las filas
            const rows = container.querySelectorAll("tr");
            rows.forEach((r) => r.classList.remove("selected-row"));
  
            // Agregar la clase 'selected-row' a la fila actual
            row.classList.add("selected-row");
  
            // Centrar el objeto en el visor
            this.focusOnObject(viewer, childDbId);
          });
        }
  
        // Recursivamente buscar en los hijos
        this.findAndDisplayFilteredObjects(
          viewer,
          tree,
          childDbId,
          container,
          filter
        );
      });
    });
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
    // Aislar el objeto en el visor
    viewer.isolate([dbId]);

    // Centrar el objeto en la vista
    viewer.fitToView([dbId]);

    setTimeout(() => {
      viewer.clearThemingColors(); // Quitar el resaltado después de 2 segundos
    }, 2000);
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

  // Obtenemos todos los dbIds del modelo
  const dbIdArray = Object.keys(instanceTree.nodeAccess.dbIdToIndex).map(
    Number
  );

  // Obtenemos propiedades en bloque para evitar multiples peticiones
  viewer.model.getBulkProperties(
    dbIdArray,
    [
      "PRESENTAR",
      "DOC-ID",
      "NOMBRE TA",
      "NOMBRE TCP",
      "NOMBRE TR",
      "Type Name",
      "name",
    ],
    (results) => {
      const objectsToShow = [];

      results.forEach((props) => {
        const presentar = props.properties.find(
          (p) => p.displayName === "PRESENTAR"
        )?.displayValue;

        if (validTypePresentar.includes(presentar)) {
          console.log("props presentar", props);
          const docId =
            props.properties.find((p) => p.displayName === "DOC-ID")
              ?.displayValue || "Sin DOC-ID";
          const nombreTA =
            props.properties.find((p) => p.displayName === "NOMBRE TA")
              ?.displayValue || "Sin NOMBRE TA";
          const nombreTCP =
            props.properties.find((p) => p.displayName === "NOMBRE TCP")
              ?.displayValue || "Sin NOMBRE TCP";
          const nombreTR =
            props.properties.find((p) => p.displayName === "NOMBRE TR")
              ?.displayValue || "Sin NOMBRE TR";
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
            } else if (normalizedName.includes("aireadores")) {
              labelText = nombreTA;
            } else if (normalizedName.includes("compensacion")) {
              labelText = nombreTCP;
            } else if (normalizedName.includes("transformador")) {
              labelText = nombreTR;
            }
            objectsToShow.push({
              dbId: props.dbId,
              center: box.getCenter(new THREE.Vector3()),
              boxSize: box.getSize(new THREE.Vector3()),
              label: createLabel(labelText, viewer),
            });
          }
        }
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
        const camera = viewer.getCamera();
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
          // 30ms entre actualizaciones
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
  // Evento de click en botón de cierre
  document
    .querySelector("#closeModalBtn")
    .addEventListener("click", closeModal);

  function onDocumentLoadSuccess(doc) {
    // Abrimos el modal cuando el modelo esté listo
    openModal();

    // Crear el visor en el contenedor dentro del modal
    Autodesk.Viewing.Initializer(
      {
        env: "AutodeskProduction",
        getAccessToken,
      },
      function () {
        const options = {
          extensions: [
            "Autodesk.Viewing.MarkupsCore",
            "Autodesk.Viewing.MarkupsGui",
          ],
        };
        viewer = new Autodesk.Viewing.GuiViewer3D(
          document.getElementById("viewerContainer")
        );
        viewer.start();
        viewer.loadDocumentNode(doc, doc.getRoot().getDefaultGeometry());
      }
    );
  }

  function onDocumentLoadFailure(code, message) {
    alert("Could not load model. See console for more details.");
    console.error(message);
  }

  // Cargamos el modelo desde Autodesk Forge
  Autodesk.Viewing.Document.load(
    "urn:" + urn,
    onDocumentLoadSuccess,
    onDocumentLoadFailure
  );
}
