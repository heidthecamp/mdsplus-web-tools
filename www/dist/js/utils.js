
export function showErrorMessage(message, goToProblem=null) {
    if (message === null) {
        // document.querySelector('#error-message').innerText = '';
        document.querySelectorAll('.toast')
            .forEach((element) => element.remove());
        return;
    }

    console.error(message);

    const toastStack = document.querySelector('.toast-stack');
    const toastTemplate = document.querySelector('#toast-error-template');

    let element = inflateTemplate(toastTemplate);
    let body = element.querySelector('.toast-body');
    body.innerText = message;
    toastStack.append(element);

    if (goToProblem !== null) {
        body.style.cursor = 'pointer';
        body.addEventListener('click', goToProblem);
    }
    
    let toast = new bootstrap.Toast(element, {
        animate: false,
        delay: 5000,
    });

    element.addEventListener('hidden.bs.toast', () => {
        element.remove();
    });

    toast.show();

    // document.querySelector('#error-message').innerText = message;
}

export function showStatusMessage(message) {
    if (message === null) {
        document.querySelector('#status').innerText = '';
        return;
    }

    document.querySelector('#status').innerText = message;
}

export function focusElement(element, timeout=1000) {
    element.classList.add('focused');
    setTimeout(() => {
        element.classList.remove('focused');
    }, timeout);

    element.focus();
}

export function inflateTemplate(template) {
    return template.content.cloneNode(true).firstElementChild;
}

export function showOverlay(onClose=null)
{
    let overlay = document.createElement('div');
    overlay.classList.add('overlay');
    document.body.append(overlay);

    overlay.addEventListener('mousedown', (e) => {
        if (e.target == overlay) {            
            if (onClose !== null) {
                onClose(overlay);
            }
            else {
                hideOverlay(overlay);
            }
        }
    });

    // TODO: Reenable?
    // document.body.addEventListener('keyup', (e) => {
    //     if (e.key === "Escape") {
    //         hideOverlay();
    //     }
    // });

    return overlay;
}

export function hideOverlay(overlay)
{
    if (overlay) {
        overlay.remove();
    }
}

export function hideAllOverlays()
{
    document.querySelector('.overlay')
        .forEach((node) => node.remove());
}

// TODO: Remove? These exist mostly for legibility
export function cloneArray(arr) {
    return [ ...arr ];
}

export function cloneObject(obj) {
    return { ...obj };
}

export function bindTooltips(element=document) {
    let triggers = [...element.querySelectorAll('[data-bs-toggle="tooltip"]')];
    return triggers.map((trigger) => {
        new bootstrap.Tooltip(trigger);
    });
}

export function bindActions(action, listener, options = {})
{
    if (!('event' in options)) {
        options.event = 'click';
    }

    if (!('element' in options)) {
        options.element = document;
    }

    let elements = options.element.querySelectorAll(`[data-action="${action}"]`);
    elements.forEach((trigger) => {
        trigger.addEventListener(options.event, listener);
    });

    return elements;
}

export function displayValue(name, value, options = {})
{
    if (!('element' in options)) {
        options.element = document;
    }

    if (!('html' in options)) {
        options.html = false;
    }

    let elements = options.element.querySelectorAll(`[data-display="${name}"]`);
    elements.forEach((element) => {
        if (element instanceof HTMLInputElement ||
            element instanceof HTMLTextAreaElement ||
            element instanceof HTMLSelectElement) {
            element.value = value;
        }
        else {
            if (options.html) {
                element.innerHTML = value;
            }
            else {
                element.innerText = value;
            }
        }
    });

    return elements;
}