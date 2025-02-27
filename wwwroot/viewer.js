import { renderTree, result2Global, tree2ContainerGlobal } from './sidebar.js';

// viewer.js
export function setupSelectionHandler(viewer, callback) {
  let currentDocId = null;
  const spinner = document.getElementById('loadingSpinner');

  // Definimos los nombres de objetos que se puedan seleccionar
  const validTypeNames = ['PHC12-500'];


  // Función para actualizar los atributos
  function updateAttributesPanel(props) {
    const atributosDiv = document.getElementById('atributos');
    if (!atributosDiv) return;

    // Extraer propiedades relevantes
    const attributes = {
      'Type Name': props.properties.find(p => p.displayName === 'Type Name')?.displayValue,
  };

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
                ${Object.entries(attributes).map(([key, value]) => `
                    <tr>
                        <td class="attribute-key">${key}</td>
                        <td class="attribute-value">${value || 'N/A'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
  }


  viewer.addEventListener(Autodesk.Viewing.SELECTION_CHANGED_EVENT, (event) => {
    const selection = event.dbIdArray;

    const atributosDiv = document.getElementById('atributos');
    
    if (selection.length === 0) {
      if (atributosDiv) atributosDiv.innerHTML = ''; // Limpiar al deseleccionar
      return;
    }

    if (selection.length === 0) return;

    const dbId = selection[0];

    viewer.getProperties(dbId, (props) => {
      const typeName = props.properties.find(
        (prop) => prop.displayName === 'Type Name'
      )?.displayValue;

      // Se verifica si el typeName está en la lista de objetos válidos
      if (!validTypeNames.includes(typeName)) {
        if (atributosDiv) atributosDiv.innerHTML = '';
        return;
      }

      if (!validTypeNames.includes(typeName)) {
        if (atributosDiv) atributosDiv.innerHTML = '';
        return;
      }

      updateAttributesPanel(props); // Actualizar panel de atributos

      console.log('pasa el filtro de type name');

      const docId = props.properties.find(
        (prop) => prop.displayName === 'DOC-ID'
      )?.displayValue;

      if (docId) {
        if (currentDocId !== docId) {
          alert(`Nuevo DOC-ID detectado: ${docId}`);
          currentDocId = docId;

          if (callback) callback(docId);

          clearTree();

          if (tree2ContainerGlobal && result2Global) {
            // Activar el contenedor padre
            const navItem = tree2ContainerGlobal.closest('.nav-item');
            if (navItem) {
              navItem.classList.add('active');
            }
            spinner.style.display = 'block';
            renderTree({
              container: tree2ContainerGlobal,
              items: result2Global,
              viewer: viewer,
              docId: docId, // Usa el nuevo DOC-ID
            }).finally(() => {
              // Ocultar spinner y asegurar despliegue
              spinner.style.display = 'none';
              if (navItem) {
                navItem.classList.add('active');
                navItem.querySelector('.nav-subitems').style.maxHeight = 'none';
              }
            });
          } else {
            console.warn('Datos de initTree no están listos aún.');
          }
        }
      } else {
        alert('El objeto seleccionado no tiene un DOC-ID para filtrar.');
        currentDocId = null;
      }
    });
  });
}

export let currentDocId = null;

export function setupSelectionHandler2(viewer, callback) {
  let currentDocId = null;
  const spinner = document.getElementById('loadingSpinner');

  viewer.addEventListener(Autodesk.Viewing.SELECTION_CHANGED_EVENT, (event) => {
    const selection = event.dbIdArray;
    if (selection.length === 0) return;

    const dbId = selection[0];

    viewer.getProperties(dbId, (props) => {
      console.log('props.properties', props.properties);
      const docId = props.properties.find(
        (prop) => prop.displayName === 'DOC-ID'
      )?.displayValue;

      if (docId) {
        if (currentDocId !== docId) {
          console.log(`Nuevo DOC-ID detectado: ${docId}`);
          alert(`Nuevo DOC-ID detectado: ${docId}`);
          currentDocId = docId;

          if (callback) callback(docId);

          clearTree();

          if (tree2ContainerGlobal && result2Global) {
            // Activar el contenedor padre
            const navItem = tree2ContainerGlobal.closest('.nav-item');
            if (navItem) {
              navItem.classList.add('active');
            }
            spinner.style.display = 'block';
            renderTree({
              container: tree2ContainerGlobal,
              items: result2Global,
              viewer: viewer,
              docId: docId, // Usa el nuevo DOC-ID
            }).finally(() => {
              // Ocultar spinner y asegurar despliegue
              spinner.style.display = 'none';
              if (navItem) {
                navItem.classList.add('active');
                navItem.querySelector('.nav-subitems').style.maxHeight = 'none';
              }
            });
          } else {
            console.warn('Datos de initTree no están listos aún.');
          }
        }
      } else {
        alert('El objeto seleccionado no tiene un DOC-ID para filtrar.');
        currentDocId = null;
      }
    });
  });
}

function clearTree() {
  if (tree2ContainerGlobal) {
    tree2ContainerGlobal.innerHTML = '';
    // Mostrar mensaje de "No hay contenido" al limpiar
    const noContentMsg = document.getElementById('no-fichas');
    if (noContentMsg) {
      noContentMsg.style.display = 'block';
    }
    // Resetear estado de renderedIds
    tree2ContainerGlobal.dataset.renderedIds = '[]';
  }
}
async function getAccessToken(callback) {
  try {
    const resp = await fetch('/api/auth/token');
    if (!resp.ok) throw new Error(await resp.text());
    const { access_token, expires_in } = await resp.json();
    callback(access_token, expires_in);
  } catch (err) {
    alert('Could not obtain access token. See the console for more details.');
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
    console.log('CustomToolExtension se ha cargado');
    return true;
  }

  unload() {
    console.log('CustomToolExtension no se ha podido cargar');

    // Limpiar recursos
    if (this._button) {
      this.removeToolbarButton();
    }
    return true;
  }

  onToolbarCreated(toolbar) {
    // Creamos un grupo de botones adicional en el toolbar
    this._group = new Autodesk.Viewing.UI.ControlGroup('custom-tool-group');

    // Creamos el botón personalizado
    this._button = new Autodesk.Viewing.UI.Button('my-custom-tool-button');
    this._button.onClick = (ev) => {
      alert('¡Botón personalizado clickeado!');
    };
    this._button.setToolTip('Mi herramienta personalizada');
    this._button.addClass('custom-tool-icon'); // Clase CSS para el ícono

    // Agregamos el botón al grupo
    this._group.addControl(this._button);

    // Agregamos el grupo a la barra de herramientas
    toolbar.addControl(this._group);
  }

  removeToolbarButton() {
    if (this._group && this._button) {
      this._group.removeControl(this._button);
      this._button = null;
    }
  }
}

// Registrar la nueva extensión
Autodesk.Viewing.theExtensionManager.registerExtension(
  'CustomToolExtension',
  CustomToolExtension
);

export function initViewer(container) {
  return new Promise(function (resolve, reject) {
    Autodesk.Viewing.Initializer(
      { env: 'AutodeskProduction', getAccessToken },
      function () {
        const config = {
          extensions: ['Autodesk.DocumentBrowser', 'CustomToolExtension'],
        };
        const viewer = new Autodesk.Viewing.GuiViewer3D(container, config);
        viewer.start();
        viewer.setTheme('light-theme');
        resolve(viewer);
      }
    );
  });
}

export function loadModel(viewer, urn) {
  function onDocumentLoadSuccess(doc) {
    viewer.loadDocumentNode(doc, doc.getRoot().getDefaultGeometry());
  }
  function onDocumentLoadFailure(code, message) {
    alert('Could not load model. See console for more details.');
    console.error(message);
  }
  Autodesk.Viewing.Document.load(
    'urn:' + urn,
    onDocumentLoadSuccess,
    onDocumentLoadFailure
  );
}

// Función para abrir el modal
function openModal() {
  document.getElementById('modelModal').style.display = 'block';
}

// Función para cerrar el modal
function closeModal() {
  document.getElementById('modelModal').style.display = 'none';
}

export function loadModel2(viewer, urn) {
  // Escuchar el evento de click en el botón de cierre
  document
    .querySelector('#closeModalBtn')
    .addEventListener('click', closeModal);

  function onDocumentLoadSuccess(doc) {
    // Abrir el modal cuando el modelo esté listo
    openModal();

    // Crear el visor en el contenedor adecuado dentro del modal
    Autodesk.Viewing.Initializer(
      {
        env: 'AutodeskProduction',
        getAccessToken,
      },
      function () {
        const options = {
          extensions: [
            'Autodesk.Viewing.MarkupsCore',
            'Autodesk.Viewing.MarkupsGui',
          ],
        };
        viewer = new Autodesk.Viewing.GuiViewer3D(
          document.getElementById('viewerContainer')
        );
        viewer.start();
        viewer.loadDocumentNode(doc, doc.getRoot().getDefaultGeometry());
      }
    );
  }

  function onDocumentLoadFailure(code, message) {
    alert('Could not load model. See console for more details.');
    console.error(message);
  }

  // Cargar el modelo desde Autodesk Forge
  Autodesk.Viewing.Document.load(
    'urn:' + urn,
    onDocumentLoadSuccess,
    onDocumentLoadFailure
  );
}
