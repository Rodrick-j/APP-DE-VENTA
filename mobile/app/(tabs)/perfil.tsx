// app/(tabs)/perfil.tsx
// Pantalla de Perfil - Panel Ejecutivo B2B y Consumidor (Diseño Premium)

/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, StatusBar,
} from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useAuthStore } from '../../stores/authStore'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { colors, typography, spacing, radius, shadows, gradients } from '../../lib/theme'
import { Avatar, Badge, Button, Card } from '../../components/ui'

const VERDE_GOBERNACION = '#15803d'
const DORADO_PREMIUM = '#b45309'

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

  // --- VISTA: SIN SESIÓN INICIADA ---
  if (!user || !perfil) {
    return (
      <View style={styles.sinSesionContainer}>
        <StatusBar barStyle="light-content" />
        <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.sinSesionGrad}>
          
          <View style={styles.decoCircleAuth} />
          
          <View style={styles.sinSesionIcono}>
            <Ionicons name="shield-checkmark" size={54} color="#f8fafc" />
          </View>
          
          <Text style={styles.sinSesionTitulo}>Acceso B2B Oruro</Text>
          <Text style={styles.sinSesionSub}>
            Únete a la red oficial de productores y consumidores de la Gobernación de Oruro.
          </Text>

          <View style={styles.authBtnGroup}>
            <Button
              variant="primary"
              label="Iniciar Sesión"
              onPress={() => router.push('/(auth)/login')}
              fullWidth
              gradient={['#16a34a', '#15803d']}
              style={{ marginBottom: spacing.md, shadowColor: '#16a34a', shadowOpacity: 0.4, shadowRadius: 8, elevation: 8 }}
              textStyle={{ color: '#fff', fontWeight: '800' }}
            />
            <Button
              variant="outline"
              label="Registrarme Gratis"
              onPress={() => router.push('/(auth)/registro')}
              fullWidth
              style={{ borderColor: 'rgba(255,255,255,0.4)', backgroundColor: 'rgba(255,255,255,0.05)' }}
              textStyle={{ color: '#fff', fontWeight: '700' }}
            />
          </View>
        </LinearGradient>
      </View>
    )
  }

  const esProductor = perfil.rol === 'productor'
  const inicialNombre = (perfil.nombre_completo ?? user.email ?? 'U')[0].toUpperCase()

  // --- VISTA: PERFIL USUARIO/PRODUCTOR ---
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>
      <StatusBar barStyle="light-content" />

      {/* HEADER EJECUTIVO (Gradiente Premium) */}
      <LinearGradient
        colors={esProductor ? ['#0f172a', '#1e293b'] : gradients.headerProfile}
        style={styles.header}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      >
        <View style={styles.decoCircle} />
        <View style={styles.decoCircle2} />

        <View style={styles.headerContent}>
          <View style={styles.avatarWrap}>
            <Avatar
              size="xl"
              imageUrl={perfil.avatar_url}
              name={perfil.nombre_completo ?? user.email}
              ring
              online
            />
            {esProductor && productor?.estado === 'verificado' && (
              <View style={styles.verifiedBadgeAbsolute}>
                <Ionicons name="checkmark-circle" size={24} color="#3b82f6" />
              </View>
            )}
          </View>

          <Text style={styles.nombre}>{perfil.nombre_completo ?? 'Usuario Oficial'}</Text>
          <Text style={styles.email}>{user.email}</Text>

          <View style={styles.badgesHeaderRow}>
            <Badge
              variant={perfil.rol === 'admin' ? 'info' : perfil.rol === 'productor' ? 'success' : 'default'}
              size="md"
              label={rolLabels[perfil.rol] ?? perfil.rol.toUpperCase()}
              style={{ backgroundColor: esProductor ? '#16a34a' : 'rgba(255,255,255,0.2)' }}
            />
            {productor?.estado === 'verificado' && (
              <Badge variant="warning" size="md" label="Sello Oruro" style={{ backgroundColor: DORADO_PREMIUM }} />
            )}
          </View>
        </View>

        <View style={styles.headerCurve} />
      </LinearGradient>


      {/* PANEL B2B PRODUCTOR (Si es Productor) */}
      {esProductor && (
        <View style={styles.panelProductorContainer}>
          <Text style={styles.menuSeccion}>🏢 Panel Empresarial (B2B)</Text>
          
          <Card variant="elevated" style={styles.productorCardVIP}>
            {!productor ? (
              <TouchableOpacity
                style={styles.productorBtn}
                onPress={() => router.push('/productor/registrar')}
                activeOpacity={0.8}
              >
                <View style={styles.productorBtnIcon}>
                  <Ionicons name="business" size={26} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.productorBtnTitulo}>Vincular mi Empresa</Text>
                  <Text style={styles.productorBtnSub}>Registra tu punto fijo GPS y catálogo para empezar a vender.</Text>
                </View>
                <Ionicons name="arrow-forward-circle" size={28} color="#15803d" />
              </TouchableOpacity>
            ) : (
              <View>
                <View style={styles.estadoRow}>
                  <Text style={styles.estadoLabel}>Estado Institucional:</Text>
                  <Badge
                    variant={productor.estado === 'verificado' ? 'success' : productor.estado === 'pendiente' ? 'warning' : 'error'}
                    size="sm"
                    label={estadoLabels[productor.estado]}
                  />
                </View>

                {productor.estado === 'pendiente' && (
                  <View style={styles.pendienteBox}>
                    <Ionicons name="time" size={20} color="#b45309" />
                    <Text style={styles.pendienteTxt}>
                      La Secretaría Departamental está revisando tu empresa. Pronto tendrás el Sello de Verificación.
                    </Text>
                  </View>
                )}

                {productor.estado === 'verificado' && (
                  <View style={styles.statsDashboard}>
                    <StatBox icon="cube" valor={productor.total_productos ?? 0} label="Productos" color={VERDE_GOBERNACION} />
                    <View style={styles.statDiv} />
                    <StatBox icon="eye" valor={productor.total_vistas ?? 0} label="Vistas" color="#2563eb" />
                    <View style={styles.statDiv} />
                    <StatBox icon="heart" valor={0} label="Favoritos" color="#e11d48" />
                  </View>
                )}

                {/* Acciones Rápidas del Productor */}
                {productor.estado === 'verificado' && (
                  <View style={styles.productorQuickActions}>
                    <TouchableOpacity style={styles.btnProductorAction} onPress={() => router.push('/productor/mis-productos')}>
                      <Ionicons name="add-circle" size={20} color="#fff" />
                      <Text style={styles.btnProductorActionTxt}>Subir Producto</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.btnProductorAction, { backgroundColor: '#f1f5f9' }]} onPress={() => {}}>
                      <Ionicons name="storefront" size={20} color={VERDE_GOBERNACION} />
                      <Text style={[styles.btnProductorActionTxt, { color: VERDE_GOBERNACION }]}>Mi Catálogo</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </Card>
        </View>
      )}


      {/* MENÚ DE USUARIO (Consumidor y Configuración) */}
      <View style={styles.menuContainer}>

        {/* Historial de Consumidor */}
        <Text style={styles.menuSeccion}>🛍️ Mis Compras y Favoritos</Text>
        <Card variant="elevated" style={styles.menuCard}>
          <MenuItem icon="heart" iconColor="#e11d48" iconBg="#ffe4e6"
            label="Productos Guardados" sub="Tu lista de deseos" onPress={() => router.push('/(tabs)/favoritos')} />
          <MenuItem icon="bag-check" iconColor="#0ea5e9" iconBg="#e0f2fe"
            label="Historial de Pedidos" sub="Compras recientes" onPress={() => {}} last />
        </Card>

        <Text style={styles.menuSeccion}>⚙️ Configuración</Text>
        <Card variant="elevated" style={styles.menuCard}>
          <MenuItem icon="person" iconColor="#b45309" iconBg="#fef3c7"
            label="Editar Datos Personales" onPress={() => {}} />
          <MenuItem icon="notifications" iconColor="#8b5cf6" iconBg="#ede9fe"
            label="Notificaciones" onPress={() => {}} />
          <MenuItem icon="location" iconColor={VERDE_GOBERNACION} iconBg="#dcfce7"
            label="Direcciones de Envío" onPress={() => {}} last />
        </Card>

        <Text style={styles.menuSeccion}>🛡️ Soporte e Información</Text>
        <Card variant="elevated" style={styles.menuCard}>
          <MenuItem icon="shield-checkmark" iconColor="#10b981" iconBg="#d1fae5"
            label="Sello Oruro y Privacidad" onPress={() => {}} />
          <MenuItem icon="headset" iconColor="#64748b" iconBg="#f1f5f9"
            label="Centro de Soporte Oficial" onPress={() => {}} last />
        </Card>

        {/* Botón Cerrar Sesión */}
        <TouchableOpacity style={styles.btnSignOutWrap} onPress={handleSignOut} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={20} color="#e11d48" />
          <Text style={styles.btnSignOutTxt}>Cerrar Sesión Segura</Text>
        </TouchableOpacity>

      </View>
    </ScrollView>
  )
}


// --- COMPONENTES INTERNOS ---

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
        <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
      </View>
    </TouchableOpacity>
  )
}

function StatBox({ icon, valor, label, color }: any) {
  return (
    <View style={styles.statBox}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <Ionicons name={icon} size={16} color={color} />
        <Text style={styles.statBoxLabel}>{label}</Text>
      </View>
      <Text style={[styles.statBoxValor, { color }]}>{valor}</Text>
    </View>
  )
}

const rolLabels: Record<string, string> = {
  'comprador': 'CONSUMIDOR OFICIAL',
  'productor': 'PRODUCTOR ORUREÑO',
  'admin': 'ADMINISTRADOR',
  'moderador': 'MODERADOR',
}

const estadoLabels: Record<string, string> = {
  'pendiente': 'EN REVISIÓN OFICIAL',
  'verificado': 'VERIFICADO - SELLO ORURO',
  'rechazado': 'RECHAZADO',
  'suspendido': 'SUSPENDIDO',
}

// --- ESTILOS PROFESIONALES ---

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },

  // Sin sesión
  sinSesionContainer: { flex: 1 },
  sinSesionGrad: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.xxxl },
  decoCircleAuth: { position: 'absolute', top: -100, right: -50, width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(255,255,255,0.03)' },
  sinSesionIcono: { width: 110, height: 110, borderRadius: 55, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: spacing.xl, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  sinSesionTitulo: { fontSize: 28, fontWeight: '900', color: '#fff', marginBottom: spacing.sm, textAlign: 'center' },
  sinSesionSub: { fontSize: 15, color: 'rgba(255,255,255,0.7)', textAlign: 'center', lineHeight: 22, marginBottom: 40 },
  authBtnGroup: { width: '100%', maxWidth: 350 },

  // Header Perfil
  header: { paddingTop: 65, paddingBottom: 50, position: 'relative', overflow: 'hidden' },
  decoCircle: { position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.05)' },
  decoCircle2: { position: 'absolute', bottom: -50, left: -50, width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(255,255,255,0.03)' },
  headerContent: { alignItems: 'center', paddingHorizontal: spacing.xxl, zIndex: 2 },
  avatarWrap: { position: 'relative', marginBottom: 12 },
  verifiedBadgeAbsolute: { position: 'absolute', bottom: 0, right: -4, backgroundColor: '#fff', borderRadius: 12, padding: 2 },
  nombre: { fontSize: 24, fontWeight: '900', color: '#fff', marginTop: 8 },
  email: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4, fontWeight: '500' },
  badgesHeaderRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
  headerCurve: { position: 'absolute', bottom: -1, left: 0, right: 0, height: 25, backgroundColor: '#f8fafc', borderTopLeftRadius: 30, borderTopRightRadius: 30 },

  // Panel Productor
  panelProductorContainer: { paddingHorizontal: 16, marginTop: -15, zIndex: 10 },
  productorCardVIP: { padding: 18, backgroundColor: '#ffffff', borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  productorBtn: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  productorBtnIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: VERDE_GOBERNACION, justifyContent: 'center', alignItems: 'center', shadowColor: VERDE_GOBERNACION, shadowOpacity: 0.4, shadowRadius: 6, elevation: 4 },
  productorBtnTitulo: { fontSize: 15, fontWeight: '800', color: '#0f172a' },
  productorBtnSub: { fontSize: 12, color: '#64748b', marginTop: 3, lineHeight: 16 },
  
  estadoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  estadoLabel: { fontSize: 13, fontWeight: '700', color: '#475569' },
  pendienteBox: { flexDirection: 'row', backgroundColor: '#fef3c7', padding: 12, borderRadius: 12, gap: 10, borderWidth: 1, borderColor: '#fde68a' },
  pendienteTxt: { flex: 1, fontSize: 12, color: '#92400e', lineHeight: 18, fontWeight: '600' },
  
  statsDashboard: { flexDirection: 'row', backgroundColor: '#f8fafc', borderRadius: 14, padding: 12, marginTop: 10, borderWidth: 1, borderColor: '#e2e8f0', justifyContent: 'space-between', alignItems: 'center' },
  statBox: { flex: 1, alignItems: 'center' },
  statDiv: { width: 1, height: 30, backgroundColor: '#cbd5e1' },
  statBoxLabel: { fontSize: 11, fontWeight: '700', color: '#64748b' },
  statBoxValor: { fontSize: 18, fontWeight: '900' },

  productorQuickActions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  btnProductorAction: { flex: 1, flexDirection: 'row', backgroundColor: VERDE_GOBERNACION, paddingVertical: 12, borderRadius: 12, justifyContent: 'center', alignItems: 'center', gap: 8 },
  btnProductorActionTxt: { color: '#fff', fontSize: 13, fontWeight: '800' },

  // Menú General
  menuContainer: { paddingHorizontal: 16, marginTop: 16 },
  menuSeccion: { fontSize: 14, fontWeight: '800', color: '#334155', marginTop: 24, marginBottom: 10, marginLeft: 6 },
  menuCard: { overflow: 'hidden', borderRadius: 18, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', gap: 14 },
  menuIconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  menuItemCenter: { flex: 1 },
  menuLabel: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  menuSub: { fontSize: 12, color: '#64748b', marginTop: 3 },
  menuItemRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  menuBadge: { backgroundColor: '#e11d48', borderRadius: 12, minWidth: 22, height: 22, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6 },
  menuBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },

  btnSignOutWrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 35, marginBottom: 20, paddingVertical: 14, borderRadius: 14, backgroundColor: '#fff', borderWidth: 1, borderColor: '#fecdd3' },
  btnSignOutTxt: { fontSize: 14, fontWeight: '800', color: '#e11d48' },
})
