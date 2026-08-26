
export function showErrorMessage(message) {
    if (message === null) {
        document.querySelector('#error-message').innerText = '';
        return;
    }

    console.error(message);
    document.querySelector('#error-message').innerText = message;
}

export function showStatusMessage(message) {
    if (message === null) {
        document.querySelector('#status').innerText = '';
        return;
    }

    document.querySelector('#status').innerText = message;
}

export function inflateTemplate(template) {
    return template.content.cloneNode(true).firstElementChild;
}

export function showOverlay(onClose=null)
{
    let $overlay = document.createElement('div');
    $overlay.classList.add('overlay');
    document.body.append($overlay);

    $overlay.addEventListener('mousedown', (e) => {
        if (e.target == $overlay) {            
            if (onClose !== null) {
                onClose($overlay);
            }
            else {
                hideOverlay($overlay);
            }
        }
    });

    // TODO: Reenable?
    // document.body.addEventListener('keyup', (e) => {
    //     if (e.key === "Escape") {
    //         hideOverlay();
    //     }
    // });

    return $overlay;
}

export function hideOverlay($overlay)
{
    if ($overlay) {
        $overlay.remove();
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