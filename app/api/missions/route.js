// app/api/missions/route.js - PARTE DO GET
export async function GET(request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Não autorizado" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username") || session.user.username;

    if (!username) {
      return NextResponse.json(
        { success: false, error: "Username não fornecido" },
        { status: 400 },
      );
    }

    await dbConnect();

    const user = await User.findOne({ username });

    // 🔥 Missões padrão com valores garantidos
    const defaultMissions = [
      {
        id: "mission_1",
        name: "Jogar 5 mãos",
        description: "Complete 5 mãos de poker",
        icon: "🎯",
        completed: false,
        claimed: false,
        progress: 0,
        required: 5,
        current: 0,
        xpReward: 50,
        chipsReward: 100,
      },
      {
        id: "mission_2",
        name: "Ganhar 3 mãos",
        description: "Vença 3 mãos contra a CPU",
        icon: "🏆",
        completed: false,
        claimed: false,
        progress: 0,
        required: 3,
        current: 0,
        xpReward: 100,
        chipsReward: 200,
      },
      {
        id: "mission_3",
        name: "Ganhar 500 fichas",
        description: "Acumule 500 fichas em vitórias",
        icon: "💰",
        completed: false,
        claimed: false,
        progress: 0,
        required: 500,
        current: 0,
        xpReward: 150,
        chipsReward: 300,
      },
    ];

    // Se usuário não existe, retorna missões padrão
    if (!user) {
      return NextResponse.json({
        success: true,
        missions: defaultMissions,
      });
    }

    // 🔥 Garantir que as missões tenham todos os campos
    let missions = user.missions || [];

    // Se não tiver missões, usar as padrão
    if (missions.length === 0) {
      missions = defaultMissions;
    } else {
      // Garantir que cada missão tenha todos os campos necessários
      missions = missions.map((m) => ({
        id: m.id || `mission_${Math.random()}`,
        name: m.name || "Missão",
        description: m.description || "Complete a missão",
        icon: m.icon || "📋",
        completed: m.completed || false,
        claimed: m.claimed || false,
        progress: m.progress || 0,
        required: m.required || 5,
        current: m.current || 0,
        xpReward: m.xpReward || 50,
        chipsReward: m.chipsReward || 100,
      }));
    }

    return NextResponse.json({
      success: true,
      missions: missions,
    });
  } catch (error) {
    console.error("Erro ao buscar missões:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
