// app/(tabs)/perfil.tsx
// Pantalla de perfil — diseño premium con theme centralizado

import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Alert, Image, StatusBar,
} from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useAuthStore } from '../../stores/authStore'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { colors, typography, spacing, radius, shadows, gradients } from '../../lib/theme'
import { Avatar, Badge, Button, Card } from '../../components/ui'

export default function PerfilScreen() {
  const { user, perfil, signOut } = useAuthStore()

  const { data: productor } = useQuery({
    queryKey: ['mi-productor', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('productores' as any)
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle()
      if (error) throw error
      return data as any
    },
    enabled: !!user && perfil?.rol === 'productor',
  })

  const handleSignOut = () => {
    signOut()
  }

  // Sin sesión — pantalla de acceso
  if (!user || !perfil) {
    return (
      <View style={styles.sinSesionContainer}>
        <StatusBar barStyle="light-content" />
        <LinearGradient colors={gradients.headerProfile} style={styles.sinSesionGrad}>
          <View style={styles.sinSesionIcono}>
            <Ionicons name="person" size={48} color="rgba(255,255,255,0.6)" />
          </View>
          <Text style={styles.sinSesionTitulo}>Tu perfil</Text>
          <Text style={styles.sinSesionSub}>Inicia sesión para ver tu perfil y acceder a todas las funciones</Text>

          <Button
            variant="primary"
            label="Iniciar sesión"
            onPress={() => router.push('/(auth)/login')}
            fullWidth
            gradient={[colors.white, colors.white]}
            style={{ marginBottom: spacing.md }}
            textStyle={{ color: colors.primary }}
          />
          <Button
            variant="outline"
            label="Crear cuenta gratis"
            onPress={() => router.push('/(auth)/registro')}
            fullWidth
            style={{ borderColor: 'rgba(255,255,255,0.5)' }}
            textStyle={{ color: '#fff' }}
          />
        </LinearGradient>
      </View>
    )
  }

  const inicialNombre = (perfil.nombre_completo ?? user.email ?? 'U')[0].toUpperCase()

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="light-content" />

      {/* Header con gradiente */}
      <LinearGradient
        colors={gradients.headerProfile}
        style={styles.header}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      >
        {/* Decoración */}
        <View style={styles.decoCircle} />

        <View style={styles.headerContent}>
          {/* Avatar */}
          <Avatar
            size="xl"
            imageUrl={perfil.avatar_url}
            name={perfil.nombre_completo ?? user.email}
            ring
            online
          />

          <Text style={styles.nombre}>{perfil.nombre_completo ?? 'Usuario'}</Text>
          <Text style={styles.email}>{user.email}</Text>

          <Badge
            variant={perfil.rol === 'admin' ? 'info' : perfil.rol === 'productor' ? 'success' : 'default'}
            size="md"
            label={rolLabels[perfil.rol] ?? perfil.rol}
            style={styles.rolBadge}
          />
        </View>

        {/* Curva inferior */}
        <View style={styles.headerCurve} />
      </LinearGradient>

      {/* Card productor */}
      {perfil.rol === 'productor' && (
        <Card variant="elevated" style={styles.productorCard}>
          {!productor ? (
            <TouchableOpacity
              style={styles.productorBtn}
              onPress={() => router.push('/productor/registrar')}
            >
              <View style={styles.productorBtnIcon}>
                <Ionicons name="add-circle" size={22} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.productorBtnTitulo}>Completar perfil de productor</Text>
                <Text style={styles.productorBtnSub}>Empieza a vender tus productos</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.primary} />
            </TouchableOpacity>
          ) : (
            <View>
              <View style={styles.estadoRow}>
                <Text style={styles.estadoLabel}>Estado:</Text>
                <Badge
                  variant={productor.estado === 'verificado' ? 'success' : productor.estado === 'pendiente' ? 'warning' : 'error'}
                  size="sm"
                  label={estadoLabels[productor.estado]}
                />
              </View>
              {productor.estado === 'pendiente' && (
                <Text style={styles.pendienteTxt}>
                  Tu perfil está siendo revisado por la Gobernación. Te notificaremos cuando sea aprobado.
                </Text>
              )}
              {productor.estado === 'verificado' && (
                <View style={styles.statsRow}>
                  <StatCard icon="cube" valor={productor.total_productos ?? 0} label="Productos" color={colors.primary} />
                  <StatCard icon="eye" valor={productor.total_vistas ?? 0} label="Vistas" color={colors.blue} />
                  <StatCard icon="heart" valor={0} label="Favoritos" color={colors.error} />
                </View>
              )}
            </View>
          )}
        </Card>
      )}

      {/* Menú */}
      <View style={styles.menuContainer}>

        {/* Acciones productor */}
        {perfil.rol === 'productor' && productor?.estado === 'verificado' && (
          <>
            <Text style={styles.menuSeccion}>Mi Negocio</Text>
            <Card variant="elevated" style={styles.menuCard}>
              <MenuItem icon="cube-outline" iconColor={colors.primary} iconBg={colors.primaryTint}
                label="Mis productos" sub="Gestiona tu catálogo"
                onPress={() => router.push('/productor/mis-productos')} />
              <MenuItem icon="location-outline" iconColor={colors.blue} iconBg={colors.blueTint}
                label="Mis puntos de venta" sub="Ubicaciones"
                onPress={() => router.push('/productor/puntos-venta')} />
              <MenuItem icon="chatbubble-outline" iconColor={colors.purple} iconBg={colors.purpleTint}
                label="Mensajes recibidos" badge={0}
                onPress={() => {}} last />
            </Card>
          </>
        )}

        <Text style={styles.menuSeccion}>Mi Cuenta</Text>
        <Card variant="elevated" style={styles.menuCard}>
          <MenuItem icon="person-outline" iconColor={colors.gold} iconBg={colors.goldTint}
            label="Editar perfil"
            onPress={() => {}} />
          <MenuItem icon="notifications-outline" iconColor={colors.error} iconBg={colors.errorTint}
            label="Notificaciones"
            onPress={() => {}} last />
        </Card>

        <Text style={styles.menuSeccion}>Información</Text>
        <Card variant="elevated" style={styles.menuCard}>
          <MenuItem icon="shield-checkmark-outline" iconColor={colors.success} iconBg={colors.successTint}
            label="Política de privacidad" onPress={() => {}} />
          <MenuItem icon="document-text-outline" iconColor={colors.textTertiary} iconBg="#f9fafb"
            label="Términos de uso" onPress={() => {}} />
          <MenuItem icon="information-circle-outline" iconColor={colors.blue} iconBg={colors.blueTint}
            label="Acerca de la app" onPress={() => {}} last />
        </Card>

        {/* Cerrar sesión */}
        <Button
          variant="outline"
          label="Cerrar sesión"
          icon="log-out-outline"
          onPress={handleSignOut}
          fullWidth
          style={styles.btnSignOut}
          textStyle={{ color: colors.error }}
        />

        <View style={{ height: 100 }} />
      </View>
    </ScrollView>
  )
}

function MenuItem({ icon, iconColor, iconBg, label, sub, onPress, badge, last }: any) {
  return (
    <TouchableOpacity
      style={[styles.menuItem, last && { borderBottomWidth: 0 }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.menuIconBox, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <View style={styles.menuItemCenter}>
        <Text style={styles.menuLabel}>{label}</Text>
        {sub && <Text style={styles.menuSub}>{sub}</Text>}
      </View>
      <View style={styles.menuItemRight}>
        {badge !== undefined && badge > 0 && (
          <View style={styles.menuBadge}>
            <Text style={styles.menuBadgeText}>{badge}</Text>
          </View>
        )}
        <Ionicons name="chevron-forward" size={16} color={colors.border} />
      </View>
    </TouchableOpacity>
  )
}

function StatCard({ icon, valor, label, color }: any) {
  return (
    <View style={[styles.statCard, { borderTopColor: color }]}>
      <Ionicons name={icon} size={22} color={color} />
      <Text style={[styles.statValor, { color }]}>{valor}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

const rolLabels: Record<string, string> = {
  'comprador': 'Comprador',
  'productor': 'Productor',
  'admin': 'Administrador',
  'moderador': 'Moderador',
}

const estadoLabels: Record<string, string> = {
  'pendiente': 'En revisión',
  'verificado': 'Verificado',
  'rechazado': 'Rechazado',
  'suspendido': 'Suspendido',
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceGray },

  // Sin sesión
  sinSesionContainer: { flex: 1 },
  sinSesionGrad: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.xxxl },
  sinSesionIcono: {
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center', alignItems: 'center', marginBottom: spacing.xxl,
  },
  sinSesionTitulo: { ...typography.hero, color: '#fff', marginBottom: spacing.md },
  sinSesionSub: { ...typography.body, color: 'rgba(255,255,255,0.7)', textAlign: 'center', lineHeight: 21, marginBottom: spacing.xxxl },

  // Header
  header: { paddingTop: 54, paddingBottom: 60, position: 'relative', overflow: 'hidden' },
  decoCircle: {
    position: 'absolute', top: -60, right: -60,
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  headerContent: { alignItems: 'center', paddingHorizontal: spacing.xxl },
  nombre: { ...typography.h2, color: '#fff', marginTop: spacing.lg },
  email: { ...typography.caption, color: 'rgba(255,255,255,0.7)', marginTop: spacing.xs },
  rolBadge: { marginTop: spacing.md },
  headerCurve: {
    position: 'absolute', bottom: -1, left: 0, right: 0,
    height: 32, backgroundColor: colors.surfaceGray,
    borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl,
  },

  // Productor card
  productorCard: {
    marginHorizontal: spacing.lg, marginTop: spacing.lg,
  },
  productorBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  productorBtnIcon: {
    width: 42, height: 42, borderRadius: radius.md,
    backgroundColor: colors.primaryTint, justifyContent: 'center', alignItems: 'center',
  },
  productorBtnTitulo: { ...typography.bodyMedium, color: colors.primary },
  productorBtnSub: { ...typography.small, color: colors.textMuted, marginTop: spacing.xxs },
  estadoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  estadoLabel: { ...typography.captionMedium, color: colors.textSecondary },
  pendienteTxt: { ...typography.small, color: '#92400e', lineHeight: 18 },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  statCard: {
    flex: 1, backgroundColor: '#f9fafb', borderRadius: radius.md,
    padding: spacing.md, alignItems: 'center', borderTopWidth: 3,
  },
  statValor: { fontSize: 22, fontWeight: '900', marginTop: spacing.xs, fontFamily: typography.h1.fontFamily },
  statLabel: { ...typography.small, color: colors.textTertiary, marginTop: spacing.xxs },

  // Menú
  menuContainer: { paddingHorizontal: spacing.lg, marginTop: spacing.sm },
  menuSeccion: {
    ...typography.label,
    color: colors.textMuted,
    marginTop: spacing.xxl - 4, marginBottom: spacing.sm, marginLeft: spacing.xs,
  },
  menuCard: {
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.lg,
    borderBottomWidth: 1, borderBottomColor: colors.surfaceGray,
    gap: spacing.md,
  },
  menuIconBox: {
    width: 38, height: 38, borderRadius: radius.md,
    justifyContent: 'center', alignItems: 'center',
  },
  menuItemCenter: { flex: 1 },
  menuLabel: { ...typography.bodyMedium, color: colors.textPrimary },
  menuSub: { ...typography.small, color: colors.textMuted, marginTop: spacing.xxs },
  menuItemRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  menuBadge: {
    backgroundColor: colors.error, borderRadius: radius.pill,
    minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.sm,
  },
  menuBadgeText: { color: '#fff', ...typography.small, fontWeight: '700' },

  // Sign out
  btnSignOut: { marginTop: spacing.xl, borderColor: colors.error + '40' },
})
