export class Usuarios {
  constructor(nombreUsuario, contrasenaUsuario, mailUsuario) {
    this.nombreUsuario = nombreUsuario;
    this.contrasenaUsuario = contrasenaUsuario;
    this.mailUsuario = mailUsuario;
    this.createdAt = new Date().toISOString();
  }
  toJSON() {
    return {
      nombreUsuario: this.nombreUsuario,
      contrasenaUsuario: this.contrasenaUsuario,
      mailUsuario: this.mailUsuario,
      createdAt: this.createdAt,
    };
  }
}
