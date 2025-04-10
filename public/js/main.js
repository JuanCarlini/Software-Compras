/**
 * Funciones generales para el sistema
 */

// Función para formatear moneda
function formatCurrency(amount, currency = 'peso') {
  const formatter = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: currency === 'peso' ? 'ARS' : 'USD',
    minimumFractionDigits: 2
  });
  
  return formatter.format(amount);
}

// Función para formatear fecha
function formatDate(dateString) {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('es-AR');
}

// Función para formatear fecha y hora
function formatDateTime(dateString) {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('es-AR') + ' ' + date.toLocaleTimeString('es-AR');
}

// Función para confirmar acciones
function confirmAction(message, callback) {
  Swal.fire({
    title: '¿Estás seguro?',
    text: message,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Sí, confirmar',
    cancelButtonText: 'Cancelar'
  }).then((result) => {
    if (result.isConfirmed) {
      callback();
    }
  });
}

// Mostrar notificación
function showNotification(title, message, type = 'success') {
  Swal.fire({
    title: title,
    text: message,
    icon: type,
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000
  });
}

// Realizar petición AJAX con manejo de errores
function ajaxRequest(url, method, data, successCallback, errorCallback) {
  $.ajax({
    url: url,
    type: method,
    data: data,
    success: function(response) {
      if (successCallback) {
        successCallback(response);
      }
    },
    error: function(xhr, status, error) {
      console.error('Error en la petición AJAX:', error);
      
      let errorMessage = 'Ha ocurrido un error en la operación';
      
      if (xhr.responseJSON && xhr.responseJSON.message) {
        errorMessage = xhr.responseJSON.message;
      }
      
      if (errorCallback) {
        errorCallback(errorMessage);
      } else {
        showNotification('Error', errorMessage, 'error');
      }
    }
  });
}

// Inicialización general cuando el documento está listo
$(document).ready(function() {
  // Inicializar tooltips de Bootstrap
  $('[data-bs-toggle="tooltip"]').tooltip();
  
  // Inicializar popovers de Bootstrap
  $('[data-bs-toggle="popover"]').popover();
  
  // Manejar formularios con método PUT o DELETE (para compatibilidad con Express)
  $('form[data-method]').on('submit', function(e) {
    const method = $(this).data('method').toUpperCase();
    
    if (method === 'PUT' || method === 'DELETE') {
      e.preventDefault();
      
      const form = $(this);
      const url = form.attr('action');
      const formData = form.serialize() + '&_method=' + method;
      
      $.ajax({
        url: url,
        type: 'POST',
        data: formData,
        success: function(response) {
          if (response.redirect) {
            window.location.href = response.redirect;
          } else if (form.data('success-message')) {
            showNotification('Éxito', form.data('success-message'));
            
            if (form.data('success-redirect')) {
              setTimeout(function() {
                window.location.href = form.data('success-redirect');
              }, 1000);
            }
          }
        },
        error: function(xhr) {
          let errorMessage = 'Ha ocurrido un error al procesar el formulario';
          
          if (xhr.responseJSON && xhr.responseJSON.message) {
            errorMessage = xhr.responseJSON.message;
          }
          
          showNotification('Error', errorMessage, 'error');
        }
      });
    }
  });
});