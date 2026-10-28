# Dirección de texturas de la oficina

Referencia estética solicitada: los interiores cálidos y artesanales de Stardew Valley. La [galería oficial](https://www.stardewvalley.net/media/) sirve como referencia visual; el estudio dibuja sus propias superficies con Canvas, sin incorporar archivos del juego.

## Materiales

- Madera en tonos miel y castaño, juntas escalonadas, grano, nudos y pequeños herrajes.
- Paredes crema con estructura de madera, marcos gruesos y ventanas hacia un exterior verde.
- Escritorios con canto, patas, cajones y sombras; los equipos y objetos conservan la identidad de cada mesa.
- Alfombra con borde tejido, macetas de terracota y follaje agrupado en varios tonos.
- Contornos oscuros y luces de pocos tonos con píxeles alineados; no se usan desenfoques sobre el dibujo del mapa.

El render del entorno está separado en public/room.js. La capa estática se conserva en un canvas auxiliar; las placas y la selección se dibujan con el estado actual. La textura es determinista y no cambia al caminar o al refrescar los eventos.

La geometría de la oficina, las colisiones y las seis mesas se mantienen. El avatar personal se dibuja desde su propio módulo. La renovación de materiales es visual; no conecta Hermes, voz ni herramientas reales.

## Personajes y objetos

La dirección se extiende a los personajes y sus retratos: silueta humanoide, cabeza y cuello legibles, cabello por mechones, contorno oscuro, ropa con pliegues y accesorios propios de cada rol. Los sprites comparten proporciones y sombreado; el avatar personal conserva los rasgos de la referencia autorizada. Los retratos usan un canvas más alto para mostrar el cuerpo completo.

Los objetos combinan siluetas escalonadas con varios tonos: terracota, follaje agrupado, cerámica, páginas y lomos de libros, tapizado y biseles. Cada mesa incorpora útiles relacionados con su rol. Los cambios de dibujo conservan el ancla de los personajes y las áreas de interacción.
