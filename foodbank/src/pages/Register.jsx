import { useNavigate } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();

  return (
    <div className="bg-foodbank relative">

      {/* ✅ LOGO TOP LEFT */}
      <img
        src="/images/logoo.png"
        alt="FoodBank Logo"
        className="absolute top-6 left-10 w-60 z-20"
      />

      {/* ✅ CENTER CONTENT */}
      <div className="relative z-20 text-center text-white">
        <h1 className="text-4xl font-bold mb-10 tracking-wide">
          REGISTRATION PAGE
        </h1>

        <div className="flex gap-10 justify-center">

          {/* DONOR CARD */}
          <div
            onClick={() => navigate("/register/donor")}
            className="w-56 h-56 bg-white/20 rounded-2xl flex flex-col items-center justify-center cursor-pointer 
                       hover:scale-110 hover:shadow-2xl transition duration-300 backdrop-blur-sm"
          >
            <span className="text-5xl mb-2">👤</span>
            <h2 className="text-lg font-semibold">DONOR</h2>
          </div>

          {/* ORGANIZATION CARD */}
          <div
            onClick={() => navigate("/register/org")}
            className="w-56 h-56 bg-white/20 rounded-2xl flex flex-col items-center justify-center cursor-pointer 
                       hover:scale-110 hover:shadow-2xl transition duration-300 backdrop-blur-sm"
          >
            <span className="text-5xl mb-2">👥</span>
            <h2 className="text-lg font-semibold">ORGANIZATION</h2>
          </div>

        </div>
      </div>
    </div>
  );
}