import { renderTree, result2Global, tree2ContainerGlobal } from "./sidebar.js";

// viewer.js
export function setupSelectionHandler(viewer) {
  viewer.addEventListener(
    Autodesk.Viewing.SELECTION_CHANGED_EVENT,
    async (event) => {
      const selection = event.dbIdArray;
      if (selection.length === 0) return;

      const dbId = selection[0];

      viewer.getProperties(dbId, (props) => {
        const docId = props.properties.find(
          (prop) => prop.displayName === 'DOC-ID'
        )?.displayValue;
      });
    }
  );
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
      const docId = props.properties.find(
        (prop) => prop.displayName === "DOC-ID"
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



function clearTree() {
  if (tree2ContainerGlobal) {
    tree2ContainerGlobal.innerHTML = '';
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

export function initViewer(container) {
  return new Promise(function (resolve, reject) {
    Autodesk.Viewing.Initializer(
      { env: 'AutodeskProduction', getAccessToken },
      function () {
        const config = {
          extensions: ['Autodesk.DocumentBrowser'],
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
  document.querySelector('#closeModalBtn').addEventListener('click', closeModal);
  
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
