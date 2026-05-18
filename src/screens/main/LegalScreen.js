/**
 * LegalScreen.js — CGU, Politique de confidentialité, Mentions légales, FAQ
 * Params : { type: 'cgu' | 'privacy' | 'mentions' | 'faq' }
 *
 * ⚠️  Ces textes sont des modèles. Faites-les relire par un juriste avant
 *     le lancement public, notamment pour la conformité RGPD.
 */

import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS, SPACING, RADIUS } from '../../lib/theme';

// ── Contenu légal ─────────────────────────────────────────────────────────────

const CONTENT = {

  cgu: {
    title: "Conditions Générales d'Utilisation",
    updated: 'Dernière mise à jour : mai 2026',
    sections: [
      {
        heading: '1. Présentation',
        body: `Swiple est une plateforme de mise en relation entre créateurs de contenu (« Clients ») et ghostwriters/monteurs spécialisés TikTok (« Freelances »). Elle est éditée par Antoine Marcouire, France.`,
      },
      {
        heading: '2. Acceptation des CGU',
        body: `L'utilisation de l'application Swiple implique l'acceptation pleine et entière des présentes Conditions Générales d'Utilisation. Si vous n'acceptez pas ces conditions, vous ne pouvez pas utiliser l'application.`,
      },
      {
        heading: '3. Inscription et compte',
        body: `L'inscription est gratuite. L'utilisateur s'engage à fournir des informations exactes et à jour. Toute création de compte par un mineur de moins de 18 ans est interdite. Chaque utilisateur est responsable de la confidentialité de ses identifiants.`,
      },
      {
        heading: '4. Fonctionnement de la plateforme',
        body: `Swiple met en relation Clients et Freelances. Les Clients publient des briefs décrivant leurs besoins. Les Freelances candidatent. Le Client choisit son Freelance et procède au paiement via notre système sécurisé. Le paiement est conservé en dépôt jusqu'à validation de la livraison par le Client.`,
      },
      {
        heading: '5. Paiements et commissions',
        body: `Swiple prélève une commission de 10 % sur chaque transaction. Les paiements sont traités par Stripe (prestataire certifié PCI DSS). Le Freelance perçoit sa rémunération uniquement après validation de la livraison par le Client. En cas de litige, Swiple peut intervenir en médiation.`,
      },
      {
        heading: '6. Obligations des Freelances',
        body: `Le Freelance s'engage à : livrer un travail original, respecter les délais annoncés, ne pas sous-traiter sans accord préalable du Client, et respecter la confidentialité du brief. Tout contenu livré doit être libre de droits ou appartenir au Freelance.`,
      },
      {
        heading: '7. Obligations des Clients',
        body: `Le Client s'engage à : fournir un brief clair et complet, répondre aux questions du Freelance dans des délais raisonnables, valider ou demander des révisions dans les 7 jours suivant la livraison, et régler le montant convenu.`,
      },
      {
        heading: '8. Révisions et litiges',
        body: `Chaque mission inclut 1 révision gratuite. Au-delà, des frais supplémentaires s'appliquent selon accord entre les parties. En cas de litige non résolu, l'utilisateur peut contacter support@swiple.app. Swiple se réserve le droit de rembourser le Client si la livraison ne correspond pas au brief.`,
      },
      {
        heading: '9. Propriété intellectuelle',
        body: `Dès validation et paiement complet, le Client acquiert les droits d'exploitation des contenus livrés. Swiple se réserve le droit d'utiliser les titres de missions (sans contenu) à des fins statistiques.`,
      },
      {
        heading: '10. Responsabilité',
        body: `Swiple est un intermédiaire technique. Swiple ne peut être tenu responsable de la qualité des travaux livrés, ni des pertes indirectes liées à l'utilisation de la plateforme. La responsabilité de Swiple est limitée au montant de la transaction concernée.`,
      },
      {
        heading: '11. Résiliation',
        body: `Swiple se réserve le droit de suspendre ou supprimer tout compte en cas de manquement aux présentes CGU, de comportement frauduleux, ou d'atteinte à l'image de la plateforme, sans préavis.`,
      },
      {
        heading: '12. Droit applicable',
        body: `Les présentes CGU sont régies par le droit français. Tout litige sera soumis à la compétence exclusive des tribunaux compétents du ressort de Paris.`,
      },
    ],
  },

  privacy: {
    title: 'Politique de Confidentialité',
    updated: 'Dernière mise à jour : mai 2026',
    sections: [
      {
        heading: '1. Responsable du traitement',
        body: `Antoine Marcouire, France. Contact : privacy@swiple.app`,
      },
      {
        heading: '2. Données collectées',
        body: `Nous collectons les données suivantes :\n• Données d'identification : nom, email, photo de profil\n• Données professionnelles : spécialités, tarifs, portfolio\n• Données de transaction : montants, statuts des missions\n• Données de connexion : adresse IP, appareil, logs d'activité\n• Messages échangés sur la plateforme`,
      },
      {
        heading: '3. Finalités et bases légales',
        body: `Vos données sont traitées pour :\n• L'exécution du contrat (art. 6.1.b RGPD) : gestion du compte, des missions et des paiements\n• L'intérêt légitime (art. 6.1.f RGPD) : prévention des fraudes, amélioration du service\n• Le consentement (art. 6.1.a RGPD) : communications marketing (désactivables à tout moment)`,
      },
      {
        heading: '4. Durée de conservation',
        body: `• Données de compte actif : durée de la relation contractuelle\n• Données de transactions : 5 ans (obligations comptables)\n• Logs de connexion : 12 mois\n• Après suppression du compte : anonymisation sous 30 jours`,
      },
      {
        heading: '5. Destinataires des données',
        body: `Vos données peuvent être partagées avec :\n• Stripe (paiements) — politique disponible sur stripe.com\n• Supabase (hébergement base de données) — serveurs en Europe\n• Expo (infrastructure mobile)\n\nNous ne vendons jamais vos données à des tiers.`,
      },
      {
        heading: '6. Vos droits (RGPD)',
        body: `Conformément au RGPD, vous disposez des droits suivants :\n• Accès à vos données\n• Rectification\n• Effacement (« droit à l'oubli »)\n• Limitation du traitement\n• Portabilité\n• Opposition\n\nPour exercer ces droits : privacy@swiple.app ou via « Supprimer mon compte » dans les paramètres.`,
      },
      {
        heading: '7. Cookies et traceurs',
        body: `L'application mobile n'utilise pas de cookies. Des identifiants techniques anonymes sont utilisés pour l'authentification et le suivi des sessions (nécessaires au fonctionnement).`,
      },
      {
        heading: '8. Sécurité',
        body: `Vos données sont chiffrées en transit (HTTPS/TLS) et au repos. Les paiements sont traités exclusivement par Stripe (certification PCI DSS niveau 1). Aucune donnée de carte bancaire n'est stockée sur nos serveurs.`,
      },
      {
        heading: '9. Réclamations',
        body: `Si vous estimez que vos droits ne sont pas respectés, vous pouvez introduire une réclamation auprès de la CNIL : cnil.fr`,
      },
    ],
  },

  mentions: {
    title: 'Mentions Légales',
    updated: 'Dernière mise à jour : mai 2026',
    sections: [
      {
        heading: 'Éditeur',
        body: `Antoine Marcouire\nParticulier\nFrance\nEmail : contact@swiple.app`,
      },
      {
        heading: 'Directeur de publication',
        body: `Antoine Marcouire\nEmail : contact@swiple.app`,
      },
      {
        heading: 'Hébergement',
        body: `Base de données : Supabase Inc., 970 Toa Payoh North, Singapour (serveurs Europe)\nInfrastructure mobile : Expo (Meta Platforms)\nPaiements : Stripe Payments Europe, Ltd., The One Building, 1 Grand Canal Street Lower, Dublin 2, Irlande`,
      },
      {
        heading: 'Propriété intellectuelle',
        body: `L'ensemble du contenu de l'application Swiple (design, textes, logo, interface) est protégé par le droit d'auteur et appartient à Antoine Marcouire. Toute reproduction sans autorisation est interdite.`,
      },
      {
        heading: 'Médiation',
        body: `Conformément à l'ordonnance n°2015-1033 du 20 août 2015, en cas de litige non résolu, vous pouvez recourir gratuitement à un médiateur de la consommation. Contact : médiation@swiple.app`,
      },
    ],
  },

  faq: {
    title: "Centre d'aide",
    updated: '',
    sections: [
      {
        heading: 'Comment fonctionne Swiple ?',
        body: `Swiple met en relation les créateurs de contenu avec des ghostwriters/monteurs spécialisés TikTok. Le Client publie un brief, les Freelances candidatent, le Client choisit et paie de façon sécurisée. Le paiement n'est libéré au Freelance qu'après validation de la livraison.`,
      },
      {
        heading: 'Mon paiement est-il sécurisé ?',
        body: `Oui. Vos paiements sont traités par Stripe, certifié PCI DSS niveau 1. Le montant est conservé en dépôt jusqu'à ce que vous validiez la livraison — vous êtes protégé en cas de non-livraison.`,
      },
      {
        heading: 'Que se passe-t-il si je ne suis pas satisfait ?',
        body: `Chaque mission inclut 1 révision gratuite. Si après révision la livraison ne correspond toujours pas au brief, vous pouvez ouvrir un litige. Notre équipe examinera le dossier et pourra procéder à un remboursement si la livraison est hors brief.`,
      },
      {
        heading: 'Comment devenir Freelance sur Swiple ?',
        body: `Créez un compte en sélectionnant le rôle « Freelance » lors de l'inscription. Complétez votre profil (spécialités, tarif, bio, portfolio) pour maximiser vos chances d'être sélectionné. Plus votre profil est complet, plus vous avez de visibilité.`,
      },
      {
        heading: 'Quels sont les frais ?',
        body: `Pour les Clients : une commission de 10 % s'ajoute au tarif du Freelance (ex : brief à 100€ → vous payez 110€).\nPour les Freelances : l'inscription et la candidature sont gratuites. Swiple prélève 10 % sur chaque mission acceptée.`,
      },
      {
        heading: 'Comment retirer mes gains (Freelance) ?',
        body: `Dans l'onglet Revenus, appuyez sur « Retirer ». Vos gains sont virés sur votre compte bancaire sous 1 à 3 jours ouvrés. Les virements sont gratuits.`,
      },
      {
        heading: 'Comment supprimer mon compte ?',
        body: `Dans Profil → Paramètres → Supprimer mon compte. La suppression est définitive. Toutes vos données seront effacées sous 30 jours conformément au RGPD.`,
      },
      {
        heading: 'Contacter le support',
        body: `Email : support@swiple.app\nNous répondons sous 24h en jours ouvrés.`,
      },
    ],
  },
};

// ── Écran ─────────────────────────────────────────────────────────────────────

export default function LegalScreen() {
  const navigation = useNavigation();
  const route      = useRoute();
  const type       = route.params?.type ?? 'cgu';
  const content    = CONTENT[type] ?? CONTENT.cgu;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={{ flex: 1 }}>

        {/* ── Top bar ── */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={22} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.topTitle} numberOfLines={2}>{content.title}</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {!!content.updated && (
            <Text style={styles.updated}>{content.updated}</Text>
          )}

          {content.sections.map((section, i) => (
            <View key={i} style={styles.section}>
              <Text style={styles.heading}>{section.heading}</Text>
              <Text style={styles.body}>{section.body}</Text>
            </View>
          ))}

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Pour toute question : support@swiple.app
            </Text>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  topBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.md, paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
    gap: 8,
  },
  backBtn:  { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  topTitle: { flex: 1, fontSize: 14, fontWeight: '800', color: COLORS.text, textAlign: 'center' },

  scroll: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.md },

  updated: {
    fontSize: 11, color: COLORS.textMuted,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },

  section: { marginBottom: SPACING.lg },
  heading: {
    fontSize: 14, fontWeight: '800', color: COLORS.text,
    marginBottom: 8,
  },
  body: {
    fontSize: 13, color: COLORS.textMuted,
    lineHeight: 20,
  },

  footer: {
    marginTop: SPACING.lg,
    padding: SPACING.md,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  footerText: { fontSize: 12, color: COLORS.textMuted, textAlign: 'center' },
});
