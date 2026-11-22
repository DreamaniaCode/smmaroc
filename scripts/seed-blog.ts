import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const existingCount = await prisma.blogPost.count();
  if (existingCount > 0) {
    console.log(`Blog already has ${existingCount} posts. Skipping seed.`);
    return;
  }

  const posts = [
    {
      title: "Guide Ultime : Développer votre audience Instagram au Maroc en 2026",
      slug: "guide-developper-audience-instagram-maroc-2026",
      excerpt: "Découvrez les stratégies concrètes et adaptées au marché marocain pour développer une communauté engagée sur Instagram : Reels, interactions ciblées et preuve sociale.",
      category: "Instagram",
      tags: "instagram, maroc, croissance, reels, influence",
      authorName: "Équipe SMMaroc",
      isPublished: true,
      publishedAt: new Date(),
      viewsCount: 142,
      coverImage: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=1200&q=80",
      content: `Instagram reste l'un des canaux les plus puissants pour les marques, créateurs et e-commerçants au Maroc. Cependant, avec l'évolution constante des algorithmes de Meta, les méthodes traditionnelles ne suffisent plus.

### 1. La domination absolue du format Reels
Les formats courts continuent de concentrer plus de 60% du temps passé sur la plateforme au Maroc. Pour maximiser votre portée :
- Captez l'attention dès les 3 premières secondes avec une accroche visuelle ou sonore forte.
- Utilisez des audios tendances adaptés au public marocain (darija, musique virale ou humour local).
- Ajoutez systématiquement des sous-titres, car une majorité d'utilisateurs regardent les vidéos sans le son.

### 2. Le rôle clé de la preuve sociale (Social Proof)
Un profil avec quelques dizaines d'abonnés a un taux de conversion bien inférieur à un profil affichant une communauté solide. L'effet de preuve sociale rassure instantanément les prospects marocains.
Utiliser un panel professionnel comme SMMaroc permet d'amorcer cette dynamique en renforçant la crédibilité de votre page : abonnés de qualité, likes réguliers sur vos publications phares et vues sur vos Reels.

### 3. Les stories et l'engagement conversationnel
Les Stories sont le lieu privilégié de la conversion. Intégrez :
- Des sondages et des boîtes à questions pour stimuler les réponses en message privé (DM).
- Des témoignages clients réels et des coulisses de vos activités.
- Des liens directs vers votre WhatsApp Business pour faciliter la commande immédiate.

En appliquant ces 3 piliers avec régularité, vous observerez une croissance exponentielle de votre notoriété et de vos ventes.`,
      seoTitle: "Développer son Instagram au Maroc en 2026 | Guide SMMaroc",
      seoDescription: "Conseils et astuces éprouvées pour accroître vos abonnés, vues Reels et ventes sur Instagram au Maroc en Dirhams (MAD).",
    },
    {
      title: "TikTok Maroc : Comment percer dans le feed Pour Toi et monétiser vos vidéos",
      slug: "tiktok-maroc-percer-pour-toi-monetisation",
      excerpt: "Comprendre l'algorithme For You (Pour Toi) au Maroc, optimiser le temps de visionnage et convertir votre audience TikTok en clients fidèles.",
      category: "TikTok",
      tags: "tiktok, pourtoi, viral, ecommerce, maroc",
      authorName: "Youssef - SMMaroc",
      isPublished: true,
      publishedAt: new Date(Date.now() - 86400000 * 2),
      viewsCount: 218,
      coverImage: "https://images.unsplash.com/photo-1596524430615-b46475ddff6e?auto=format&fit=crop&w=1200&q=80",
      content: `TikTok a révolutionné la création de contenu et le commerce digital au Maroc. Grâce à son algorithme basé sur l'intérêt plutôt que sur le nombre d'abonnés, tout le monde a l'opportunité de devenir viral du jour au lendemain.

### Comment fonctionne l'algorithme TikTok en 2026 ?
L'indicateur le plus scruté par TikTok est le **taux de rétention** (Watch Time). Si 70% de vos spectateurs regardent votre vidéo jusqu'à la fin, l'algorithme la propulsera automatiquement dans le flux Pour Toi (FYP) d'un public élargi au Maroc et dans le monde arabe.

### Les bonnes pratiques pour maximiser votre diffusion :
1. **Rythme soutenu et montage dynamique :** Supprimez tous les temps morts. Changez d'angle de caméra toutes les 3 à 4 secondes.
2. **Amplification initiale :** Les premières minutes suivant la publication sont décisives. Booster le démarrage avec des vues et des partages permet de déclencher l'intérêt des robots d'indexation TikTok.
3. **Appel à l'action clair :** Incitez les utilisateurs à commenter ou à enregistrer la vidéo en favori, deux signaux très fortement valorisés.

Avec les services TikTok de SMMaroc, vous disposez d'un levier puissant pour accélérer la visibilité de vos créations et propulser vos produits vers les sommets.`,
      seoTitle: "Comment percer sur TikTok au Maroc | Guide Algorithme",
      seoDescription: "Maîtrisez l'algorithme TikTok marocain pour faire décoller vos vues, abonnés et partages rapidement.",
    },
    {
      title: "Pourquoi choisir un panel SMM en Dirhams (MAD) avec support local ?",
      slug: "pourquoi-choisir-panel-smm-maroc-en-dirhams",
      excerpt: "Avantages fiscaux, absence de frais de change bancaires, paiements locaux et support WhatsApp direct : découvrez pourquoi SMMaroc est la référence nationale.",
      category: "Stratégie",
      tags: "smmaroc, panel-smm, dirham, cih, attijari, whatsapp",
      authorName: "Fondateur SMMaroc",
      isPublished: true,
      publishedAt: new Date(Date.now() - 86400000 * 5),
      viewsCount: 95,
      coverImage: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1200&q=80",
      content: `De nombreux créateurs et agences au Maroc ont longtemps utilisé des panels étrangers en devises étrangères (USD, EUR, Crypto). Cette pratique entraîne de multiples désagréments :

- Frais de conversion bancaires élevés (jusqu'à 5% par transaction)
- Dotation e-commerce internationale rapidement épuisée
- Support client anglophone peu réactif avec plusieurs heures de décalage horaire
- Absence totale de garantie sur la livraison des services

### L'avantage SMMaroc : 100% pensé pour les professionnels marocains
SMMaroc a été conçu pour éliminer ces frictions en proposant une infrastructure moderne et fiable :
1. **Tarification transparente en Dirham marocain (MAD) :** Pas de frais cachés, vous payez exactement ce que vous voyez.
2. **Moyens de recharge adaptés :** Virements instantanés (CIH Bank, Attijariwafa, Bank of Africa) et validation rapide.
3. **Assistance humaine sur WhatsApp :** Notre équipe basée au Maroc répond à vos questions techniques et suit vos commandes prioritaires.
4. **API Revendeur complète :** Vous pouvez connecter vos propres plateformes via notre API sécurisée et générer des revenus récurrents.

Rejoignez dès maintenant les centaines d'agences et entrepreneurs qui font confiance à SMMaroc pour propulser leur présence en ligne.`,
      seoTitle: "Pourquoi choisir un panel SMM marocain en Dirhams (MAD)",
      seoDescription: "Fini les frais de change et les soucis de dotation. Optez pour SMMaroc : panel SMM n°1 au Maroc avec paiement en MAD et support WhatsApp.",
    },
  ];

  for (const post of posts) {
    await prisma.blogPost.create({ data: post });
    console.log(`Created blog post: ${post.title}`);
  }

  console.log("Seeding blog posts complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
