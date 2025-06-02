export default function RegistrationError() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#FFE5E5] text-center">
      <div className="bg-white p-8 rounded-xl shadow-md max-w-lg">
        <h2 className="text-2xl font-bold text-[#466896] mb-4">Une erreur est survenue ❌</h2>
        <p className="text-gray-700">
          L'inscription n'a pas pu être complétée. Veuillez vérifier vos informations ou réessayer plus tard.
        </p>
      </div>
    </div>
  );
}
