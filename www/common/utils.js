
export function showErrorMessage(message) {
    console.error(message);
    document.querySelector('#error-message').innerText = message;
}

export function showStatusMessage(message) {
    document.querySelector('#status').innerText = message;
}

export function inflateTemplate(id) {
    return document.getElementById(id).content.cloneNode(true);
}

export function showOverlay()
{
    let $overlay = document.createElement('div');
    $overlay.id = 'overlay';
    $overlay.classList.add('shown');
    document.body.append($overlay);

    $overlay.addEventListener('mousedown', (e) => {
        if (e.target == $overlay) {
            hideOverlay();
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

export function hideOverlay()
{
    let $overlay = document.querySelector('#overlay');
    if ($overlay) {
        $overlay.remove();
    }
}