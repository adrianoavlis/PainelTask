
export const ToastView = {
  init() {
    const toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'position-fixed bottom-0 end-0 p-3';
    toastContainer.style.zIndex = '1080';
    document.body.appendChild(toastContainer);
  },

  show(message, type = 'success') {
    const toastId = 'toast-' + Date.now();
    const toast = document.createElement('div');
    toast.className = 'toast align-items-center text-bg-' + type + ' border-0 show';
    toast.role = 'alert';
    toast.ariaLive = 'assertive';
    toast.ariaAtomic = 'true';
    toast.id = toastId;

    toast.innerHTML = \`
      <div class="d-flex">
        <div class="toast-body">\${message}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Fechar"></button>
      </div>
    \`;

    document.getElementById('toast-container').appendChild(toast);

    // Remover automaticamente após 5s
    setTimeout(() => {
      toast.classList.remove('show');
      toast.remove();
    }, 5000);
  }
};
