export type Vehicle = {
  id: string;
  brand: string;
  model: string;
  name: string;
  year: string;
  km: string;
  transmission: string;
  fuel: string;
  color: string;
  price: string;
  imageUrl: string;
  shortSpecs: string;
  description?: string;
  isWeeklyHighlight: boolean; // Definido pelo administrador no cadastro.
};

// Estes dados simulam o que o administrador define no painel de cadastro.
// Na integracao com backend, substitua por dados vindos do banco.
export const featuredVehicles: Vehicle[] = [
  {
    id: "jeep-compass-longitude-2022",
    brand: "Jeep",
    model: "Compass Longitude",
    name: "Jeep Compass Longitude",
    year: "2022",
    km: "31.000 km",
    transmission: "Automático",
    fuel: "Flex",
    color: "Cinza",
    price: "R$ 139.900",
    imageUrl:
      "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=900&q=80",
    shortSpecs: "31.000 km | Flex | Automático | Revisões em dia",
    description: "SUV completo com historico revisado e alta procura no mercado.",
    isWeeklyHighlight: true,
  },
  {
    id: "honda-civic-touring-2021",
    brand: "Honda",
    model: "Civic Touring",
    name: "Honda Civic Touring",
    year: "2021",
    km: "44.000 km",
    transmission: "Automático",
    fuel: "Flex",
    color: "Preto",
    price: "R$ 142.500",
    imageUrl:
      "https://images.unsplash.com/photo-1549924231-f129b911e442?auto=format&fit=crop&w=900&q=80",
    shortSpecs: "44.000 km | Flex | Automático | Blindagem não",
    description: "Sedan premium com excelente desempenho e conforto interno.",
    isWeeklyHighlight: false,
  },
  {
    id: "yamaha-mt07-2023",
    brand: "Yamaha",
    model: "MT-07 ABS",
    name: "Yamaha MT-07 ABS",
    year: "2023",
    km: "11.000 km",
    transmission: "Manual",
    fuel: "Gasolina",
    color: "Azul",
    price: "R$ 47.900",
    imageUrl:
      "https://images.unsplash.com/photo-1558981285-6f0c94958bb6?auto=format&fit=crop&w=900&q=80",
    shortSpecs: "11.000 km | 689cc | Revisão em concessionária",
    description: "Naked esportiva em estado de nova, ideal para cidade e estrada.",
    isWeeklyHighlight: true,
  },
  {
    id: "toyota-corolla-xei-2022",
    brand: "Toyota",
    model: "Corolla XEi",
    name: "Toyota Corolla XEi",
    year: "2022",
    km: "27.000 km",
    transmission: "Automático",
    fuel: "Flex",
    color: "Prata",
    price: "R$ 136.900",
    imageUrl:
      "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=900&q=80",
    shortSpecs: "27.000 km | Flex | Automático | Único dono",
    description: "Sedan confiável com manutenção em dia e baixo custo operacional.",
    isWeeklyHighlight: false,
  },
  {
    id: "bmw-gs-850-2021",
    brand: "BMW",
    model: "GS 850",
    name: "BMW GS 850",
    year: "2021",
    km: "18.500 km",
    transmission: "Manual",
    fuel: "Gasolina",
    color: "Preto",
    price: "R$ 61.200",
    imageUrl:
      "https://images.unsplash.com/photo-1515777315835-281b94c9589f?auto=format&fit=crop&w=900&q=80",
    shortSpecs: "18.500 km | ABS Pro | Full revisada",
    description: "Big trail para viagens longas com conforto e eletrônica embarcada.",
    isWeeklyHighlight: true,
  },
  {
    id: "vw-nivus-highline-2023",
    brand: "Volkswagen",
    model: "Nivus Highline",
    name: "Volkswagen Nivus Highline",
    year: "2023",
    km: "19.300 km",
    transmission: "Automático",
    fuel: "Flex",
    color: "Branco",
    price: "R$ 129.990",
    imageUrl:
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=80",
    shortSpecs: "19.300 km | TSI | Câmera 360",
    description: "SUV coupé moderno com pacote tecnológico e excelente acabamento.",
    isWeeklyHighlight: false,
  },
];

export const weeklyHighlights = featuredVehicles.filter(
  (vehicle) => vehicle.isWeeklyHighlight,
);

export const benefits = [
  {
    text: "Você fala com gente de verdade, do começo ao fim.",
    icon: "handshake",
  },
  {
    text: "Veículos com procedência validada e histórico claro.",
    icon: "shield",
  },
  {
    text: "Atendimento rápido no WhatsApp quando você precisar.",
    icon: "whatsapp",
  },
  {
    text: "Equipe que entende de carro e moto.",
    icon: "car",
  },
];
