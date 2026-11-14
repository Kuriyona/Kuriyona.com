import text from './greet.txt?raw';

export const greet = () => {
  console.log(`%c ${text}`, 'color: #00dc82;');
  console.log(
    `%c Welcome to Kuriyona's website!`,
    'background-color: #00dc82; color: #000; font-size: 16px; padding: 4px; border-radius: 4px;',
  );
};
