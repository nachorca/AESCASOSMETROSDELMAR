export default function PagoCorrectoPage() {
  return (
    <main style={{ padding: "40px", textAlign: "center" }}>
      <h1>Reserva recibida correctamente</h1>

      <p>
        El pago se ha procesado correctamente. Hemos recibido tu solicitud de
        reserva.
      </p>

      <p>
        En breve contactaremos contigo para confirmar todos los detalles de tu
        estancia.
      </p>

      <a
        href="/"
        style={{
          display: "inline-block",
          marginTop: "24px",
          padding: "12px 20px",
          background: "#111",
          color: "#fff",
          textDecoration: "none",
          borderRadius: "8px",
        }}
      >
        Volver a la página principal
      </a>
    </main>
  );
}
