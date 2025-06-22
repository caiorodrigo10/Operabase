export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const getTextAlignValue = (textAlign: string): string => {
  switch (textAlign) {
    case 'left':
      return 'start';
    case 'right':
      return 'end';
    case 'center':
      return 'center';
    case 'justify':
      return 'justify';
    default:
      return 'start';
  }
};

export const formatText = (text: string): string => {
  return text.replace(/\n/g, '<br />');
};

export const weightDescription = (weight: string): string => {
  switch (weight) {
    case '400':
      return 'Normal';
    case '500':
      return 'Medium';
    case '600':
      return 'Semi Bold';
    case '700':
      return 'Bold';
    case '800':
      return 'Extra Bold';
    default:
      return 'Normal';
  }
};