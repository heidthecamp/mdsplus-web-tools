
const DefaultMargin = {
    left: 60,
    right: 10,
    top: 10,
    bottom: 30,
};

export class Renderer
{
    constructor(
        element,
        onZoomIn = null,
        onZoomOut = null,
        margin = DefaultMargin,
    ) {
        this.element = element;
        this.onZoomIn = onZoomIn;
        this.onZoomOut = onZoomOut;
        this.margin = margin;
    }

    render(traces) {
        // virtual
    }
}
