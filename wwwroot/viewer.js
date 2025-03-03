import { renderTree, result2Global, tree2ContainerGlobal } from './sidebar.js';

// viewer.js
export function setupSelectionHandler(viewer, callback) {
  let currentDocId = null;
  const spinner = document.getElementById('loadingSpinner');

  // Definimos los nombres/propiedades de objetos que se puedan seleccionar
  const validTypePresentar = ['Si'];

  // Función para actualizar los atributos
  function updateAttributesPanel(props) {
    const atributosDiv = document.getElementById('atributos');
    const noFichasDiv = document.getElementById('no-fichas');

    if (!atributosDiv || !noFichasDiv) return;

    // Extraer propiedades relevantes
    const attributes = {
      Comments: props.properties.find((p) => p.displayName === 'Comments')
        ?.displayValue,
      'DOC-ID': props.properties.find((p) => p.displayName === 'DOC-ID')
        ?.displayValue,
    };

    // Verificar si hay atributos
    const hasAttributes = Object.values(attributes).some(
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
          ${Object.entries(attributes)
            .map(
              ([key, value]) => `
              <tr>
                <td class="attribute-key">${key}</td>
                <td class="attribute-value">${value || 'N/A'}</td>
              </tr>
            `
            )
            .join('')}
        </tbody>
      </table>
    `;
      // Ocultar el mensaje de "No hay fichas técnicas disponibles" si hay atributos
      noFichasDiv.style.display = 'none';
    } else {
      // Mostrar ambos mensajes si no hay atributos
      atributosDiv.innerHTML = `<h3 class="attributes-header">El elemento no tiene atributos</h3>`;
      noFichasDiv.style.display = 'block';
    }
  }

  viewer.addEventListener(Autodesk.Viewing.SELECTION_CHANGED_EVENT, (event) => {
    const selection = event.dbIdArray;

    const atributosDiv = document.getElementById('atributos');
    const noFichasDiv = document.getElementById('no-fichas');

    if (selection.length === 0) {
      // Mostrar ambos mensajes si no hay selección
      if (atributosDiv)
        atributosDiv.innerHTML = `<h3 class="attributes-header">El elemento no tiene atributos</h3>`;
      if (noFichasDiv) noFichasDiv.style.display = 'block';
      return;
    }

    if (selection.length === 0) return;

    const dbId = selection[0];

    viewer.getProperties(dbId, (props) => {
      const typeName = props.properties.find(
        (prop) => prop.displayName === 'PRESENTAR'
      )?.displayValue;

      // Se verifica si el typeName está en la lista de objetos válidos
      if (!validTypePresentar.includes(typeName)) {
        // Mostrar ambos mensajes si el objeto no es válido
        if (atributosDiv)
          atributosDiv.innerHTML = `<h3 class="attributes-header">El elemento no tiene atributos</h3>`;
        if (noFichasDiv) noFichasDiv.style.display = 'block';
        clearTree();
        result2Global = null;
        currentDocId = null;
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

export function initViewer(container) {
  return new Promise(function (resolve, reject) {
    Autodesk.Viewing.Initializer(
      { env: 'AutodeskProduction', getAccessToken },
      function () {
        const config = {
          extensions: [
            'Autodesk.DocumentBrowser',
            'Autodesk.Viewing.MarkupsCore',
          ],
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
    alert('Could not load model. See console for more details.');
    console.error(message);
  }
  Autodesk.Viewing.Document.load(
    'urn:' + urn,
    onDocumentLoadSuccess,
    onDocumentLoadFailure
  );
}

function filterObjectsByPresentar(viewer) {
  const validTypePresentar = ['Si'];
  const instanceTree = viewer.model.getData().instanceTree;
  const fragList = viewer.model.getFragmentList();

  // Eliminamos etiquetas anteriores
  const existingLabels = viewer.container.querySelectorAll('.presentar-label');
  existingLabels.forEach((label) => label.remove());

  // Obtenemos todos los dbIds del modelo
  const dbIdArray = Object.keys(instanceTree.nodeAccess.dbIdToIndex).map(Number);

  // Obtenemos propiedades en bloque para evitar multiples peticiones
  viewer.model.getBulkProperties(dbIdArray, ['PRESENTAR', 'DOC-ID'], (results) => {
    const objectsToShow = [];

    results.forEach((props) => {
      const presentar = props.properties.find((p) => p.displayName === 'PRESENTAR')?.displayValue;
      const docId = props.properties.find((p) => p.displayName === 'DOC-ID')?.displayValue || 'Sin DOC-ID';

      if (validTypePresentar.includes(presentar)) {
        let box = new THREE.Box3();

        instanceTree.enumNodeFragments(props.dbId, (fragId) => {
          let fragBox = new THREE.Box3();
          fragList.getWorldBounds(fragId, fragBox);
          box.union(fragBox);
        });

        if (!box.isEmpty()) {
          objectsToShow.push({
            dbId: props.dbId,
            center: box.getCenter(new THREE.Vector3()),
            boxSize: box.getSize(new THREE.Vector3()),
            label: createLabel(docId, viewer)
          });
        }
      }
    });

    function createLabel(text, viewer) {
      const label = document.createElement('div');
      label.className = 'presentar-label';
      label.textContent = text;
      label.style.position = 'absolute';
      label.style.color = 'black';
      label.style.border = '2px solid rgba(255, 255, 255, 0.5)';
      label.style.padding = '4px 6px';
      label.style.borderRadius = '50%';
      label.style.pointerEvents = 'none';
      label.style.fontSize = '0.85rem';
      label.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
      label.style.boxShadow = 'inset 0 0 10px rgba(255, 255, 255, 0.3), 0 4px 8px rgba(0, 0, 0, 0.2)';
      label.style.display = 'none';

      viewer.container.appendChild(label);
      return label;
    }

    function updateLabels() {
      const camera = viewer.getCamera();
      const viewerWidth = viewer.container.clientWidth;
      const viewerHeight = viewer.container.clientHeight;

      objectsToShow.forEach((obj) => {
        const screenPos = viewer.worldToClient(obj.center);
        const screenBoxSize = viewer.worldToClient(obj.boxSize.clone().add(obj.center));

        const screenWidth = Math.abs(screenBoxSize.x - screenPos.x);
        const screenHeight = Math.abs(screenBoxSize.y - screenPos.y);

        if (screenWidth > viewerWidth * 0.03 || screenHeight > viewerHeight * 0.03) {
          obj.label.style.display = 'block';
          obj.label.style.left = `${screenPos.x}px`;
          obj.label.style.top = `${screenPos.y}px`;
        } else {
          obj.label.style.display = 'none';
        }
      });
    }

    // Optimizamos con throttle (evita actualizaciones excesivas)
    let lastUpdate = 0;
    function throttledUpdateLabels() {
      const now = performance.now();
      if (now - lastUpdate > 30) { // 30ms entre actualizaciones
        lastUpdate = now;
        updateLabels();
      }
    }

    viewer.addEventListener(Autodesk.Viewing.CAMERA_CHANGE_EVENT, throttledUpdateLabels);

    // Llamada inicial
    updateLabels();
  });
}


// Abrir modal
function openModal() {
  document.getElementById('modelModal').style.display = 'block';
}

// Cerrar modal
function closeModal() {
  document.getElementById('modelModal').style.display = 'none';
}

export function loadModel2(viewer, urn) {
  // Evento de click en botón de cierre
  document
    .querySelector('#closeModalBtn')
    .addEventListener('click', closeModal);

  function onDocumentLoadSuccess(doc) {
    // Abrimos el modal cuando el modelo esté listo
    openModal();

    // Crear el visor en el contenedor dentro del modal
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

  // Cargamos el modelo desde Autodesk Forge
  Autodesk.Viewing.Document.load(
    'urn:' + urn,
    onDocumentLoadSuccess,
    onDocumentLoadFailure
  );
}
