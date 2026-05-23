import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = 'GHS') {
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${currency} ${formatted}`;
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function prepareElementForPDF(element: HTMLElement): HTMLElement {
  const clone = element.cloneNode(true) as HTMLElement;
  clone.style.width = '800px';
  clone.style.minWidth = '800px';
  clone.style.position = 'absolute';
  clone.style.left = '-9999px';
  clone.style.top = '0';
  clone.style.background = 'white';
  
  // Recursively process all children to convert sm/md/lg classes to normal classes
  const processNode = (node: HTMLElement) => {
    if (node.classList) {
      const classesToAdd: string[] = [];
      const classesToRemove: string[] = [];
      node.classList.forEach(className => {
        if (className.startsWith('sm:') || className.startsWith('md:') || className.startsWith('lg:')) {
          const baseClass = className.split(':')[1];
          classesToAdd.push(baseClass);
          
          // Identify prefixes (e.g., 'p', 'm', 'text', 'grid', 'flex') to replace responsive counterparts
          const prefix = baseClass.split('-')[0];
          node.classList.forEach(c => {
            if (c.startsWith(prefix) && c !== className && !c.includes(':')) {
              classesToRemove.push(c);
            }
          });
        }
      });
      classesToRemove.forEach(c => node.classList.remove(c));
      classesToAdd.forEach(c => node.classList.add(c));
    }
    for (let i = 0; i < node.children.length; i++) {
      processNode(node.children[i] as HTMLElement);
    }
  };
  
  processNode(clone);
  document.body.appendChild(clone);
  return clone;
}
