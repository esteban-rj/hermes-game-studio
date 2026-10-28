# Oficina vectorial con Hermes real

La v0.3 usa una escena SVG de 1660 × 1080. Los seis agentes tienen animaciones
propias de respiración, parpadeo y herramientas; el personaje del usuario tiene
marcha animada. Las animaciones respetan la preferencia de movimiento reducido.

1. Inicia el servidor y abre http://127.0.0.1:4317.
2. Selecciona un agente en la fila del equipo o toca su personaje en el mundo.
   En móvil se abre un panel inferior; en escritorio permanece a la derecha.
3. Escribe para conversar con su perfil real. La sesión y el historial persisten.
4. Camina con WASD/flechas, la cruceta táctil o tocando un punto del suelo.
   Las rutas y colisiones comparten la geometría de la habitación.
5. La cámara sigue al personaje. Usa +/−, rueda o pellizco para acercar; arrastra
   para explorar. El icono de ubicación recupera el seguimiento y el de mapa
   encuadra toda la oficina. «Sala TV» lleva al personaje a la sala con sofá.
6. Pide un gráfico para la TV: el agente puede preparar una composición vectorial
   que el backend valida y publica. El resultado enlazado aparece en su chat,
   la galería y la pantalla física de la sala.
7. «Añadir resultado» permite adjuntar imagen o vídeo a un agente. El formulario
   conserva la diferencia entre un adjunto y un resultado de Hermes. La vista
   ampliada permite navegar entre resultados; el vídeo tiene controles nativos.
   Si el navegador no reproduce el códec, ofrece descargar el archivo original.

La base CSS está diseñada para móvil y añade columnas de escritorio a 1100 px.
Los controles táctiles tienen áreas de 44 px; la entrada de texto móvil usa 16 px.
El panel móvil acota foco, cierra con Escape y conserva acceso a la oficina al
cerrar. Los diálogos usan el comportamiento modal nativo del navegador.

Sólo hay un turno Hermes concurrente. Cambiar de agente conserva conversaciones
separadas. Los fallos se muestran sin respuestas predefinidas. Los bloques de
gráficos en streaming no se presentan como código en la conversación.

La foto original no se conserva. El avatar vectorial mantiene sus rasgos visuales
ya aprobados. La voz y la ejecución de código desde la oficina siguen pendientes;
el Git local de juegos utiliza el flujo CLI separado de PROJECTS.md.

QA y límites observados están en VERIFICATION.md. Los tests ordinarios no llaman
modelos. El backend conserva el máximo Sol 6.1 y no añade un proveedor de pago.
