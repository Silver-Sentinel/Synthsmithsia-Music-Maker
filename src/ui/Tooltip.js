export class Tooltip {
    static create(text) {
        const icon = document.createElement('span');
        icon.className = 'tooltip-icon';
        icon.innerText = '?';
        icon.style.position = 'relative'; // Ensure icon is a reference point if needed

        const popup = document.createElement('div');
        popup.className = 'tooltip-popup';
        popup.innerText = text;

        // Base styles to ensure it looks right even if CSS fails
        popup.style.display = 'none';
        popup.style.position = 'fixed'; // KEY FIX: Fixed escapes overflow:hidden
        popup.style.zIndex = '10000';
        popup.style.width = '200px';
        popup.style.background = '#141418';
        popup.style.border = '1px solid #00ff9d';
        popup.style.padding = '8px';
        popup.style.borderRadius = '4px';
        popup.style.pointerEvents = 'none';
        popup.style.textAlign = 'left';
        popup.style.color = 'white';
        popup.style.fontSize = '12px';

        icon.appendChild(popup);

        icon.addEventListener('mouseenter', () => {
            const rect = icon.getBoundingClientRect();

            popup.style.display = 'block';
            popup.style.top = (rect.top - 10 - popup.offsetHeight) + 'px'; // Position above
            popup.style.left = (rect.left + rect.width / 2 - 100) + 'px'; // Center horizontally

            // Boundary checks
            const popupRect = popup.getBoundingClientRect();
            if (popupRect.top < 0) {
                popup.style.top = (rect.bottom + 10) + 'px'; // Flip to bottom
            }
            if (popupRect.left < 0) {
                popup.style.left = '10px';
            }
        });

        icon.addEventListener('mouseleave', () => {
            popup.style.display = 'none';
        });

        return icon;
    }

    static attach(element, text) {
        const icon = this.create(text);
        element.appendChild(icon);
    }
}
