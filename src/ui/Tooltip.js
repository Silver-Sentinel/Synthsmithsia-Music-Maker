export class Tooltip {
    static create(text) {
        const icon = document.createElement('span');
        icon.className = 'tooltip-icon';
        icon.innerText = '?';

        const popup = document.createElement('div');
        popup.className = 'tooltip-popup';
        popup.innerText = text;

        icon.appendChild(popup);
        return icon;
    }

    static attach(element, text) {
        const icon = this.create(text);
        element.appendChild(icon);
    }
}
