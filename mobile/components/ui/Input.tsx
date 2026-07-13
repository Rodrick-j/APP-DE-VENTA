// components/ui/Input.tsx
// Input reutilizable con icono, error state, label

import React, { useState, useRef } from 'react'
import {
  View, Text, TextInput, StyleSheet, TextInputProps,
  Animated, TouchableOpacity, ViewStyle,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, typography, radius, spacing } from '../../lib/theme'

interface InputProps extends TextInputProps {
  label?: string
  icon?: keyof typeof Ionicons.glyphMap
  error?: string
  rightIcon?: keyof typeof Ionicons.glyphMap
  onRightIconPress?: () => void
  containerStyle?: ViewStyle
}

export function Input({
  label,
  icon,
  error,
  rightIcon,
  onRightIconPress,
  containerStyle,
  style,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false)
  const borderAnim = useRef(new Animated.Value(0)).current

  const onFocus = () => {
    setIsFocused(true)
    Animated.timing(borderAnim, { toValue: 1, duration: 200, useNativeDriver: false }).start()
    props.onFocus?.({} as any)
  }

  const onBlur = () => {
    setIsFocused(false)
    Animated.timing(borderAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start()
    props.onBlur?.({} as any)
  }

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [error ? colors.error : colors.border, error ? colors.error : colors.primary],
  })

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Animated.View style={[styles.container, { borderColor }, isFocused && styles.focused, error && styles.error]}>
        {icon ? (
          <Ionicons name={icon} size={18} color={isFocused ? colors.primary : colors.textMuted} style={styles.icon} />
        ) : null}
        <TextInput
          style={[styles.input, props.multiline && styles.multiline, style]}
          placeholderTextColor={colors.textPlaceholder}
          onFocus={onFocus}
          onBlur={onBlur}
          {...props}
        />
        {rightIcon ? (
          <TouchableOpacity onPress={onRightIconPress} style={styles.rightIcon}>
            <Ionicons name={rightIcon} size={18} color={colors.textMuted} />
          </TouchableOpacity>
        ) : null}
      </Animated.View>
      {error ? (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle" size={13} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
    </View>
  )
}

// ─── Estilos ──────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.captionMedium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    minHeight: 52,
  },
  focused: {
    backgroundColor: colors.primaryTint,
  },
  error: {
    borderColor: colors.error,
  },
  icon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    paddingVertical: spacing.md,
  },
  multiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  rightIcon: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
  errorText: {
    ...typography.small,
    color: colors.error,
  },
})

export default Input
