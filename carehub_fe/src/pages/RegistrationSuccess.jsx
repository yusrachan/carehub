export default function RegistrationSuccess() {
  return (
    <div className="flex flex-col items-center justify-center h-screen w-screen bg-[#D9E1E8] text-center">
      <div className="bg-white p-8 rounded-xl shadow-md max-w-lg">
        <h2 className="text-2xl font-bold text-[#466896] mb-4">Inscription réussie 🎉</h2>
        <p className="text-gray-700">
          Merci pour votre inscription ! Un e-mail de confirmation vous a été envoyé. 
          Veuillez finaliser votre inscription en suivant les instructions dans votre boîte mail.
        </p>
      </div>
    </div>
  );
}
