import React, { ReactNode } from 'react';
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Colors } from '../../constants';

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
}

export function FormField({ label, required, error, hint, children }: FormFieldProps) {
  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {required && <Text style={styles.required}>*</Text>}
      </View>
      {children}
      {error && <Text style={styles.error}>{error}</Text>}
      {hint && !error && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
}

interface TextFieldProps extends TextInputProps {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  unit?: string;
}

export function TextField({
  label,
  required,
  error,
  hint,
  unit,
  style,
  ...props
}: TextFieldProps) {
  return (
    <FormField label={label} required={required} error={error} hint={hint}>
      <View style={styles.inputWrapper}>
        <TextInput
          style={[styles.input, error ? styles.inputError : null, unit ? styles.inputWithUnit : null, style]}
          placeholderTextColor={Colors.textMuted}
          {...props}
        />
        {unit && <Text style={styles.unit}>{unit}</Text>}
      </View>
    </FormField>
  );
}

interface SelectFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  value: string;
  placeholder?: string;
  onPress: () => void;
  displayValue?: string;
}

export function SelectField({
  label,
  required,
  error,
  value,
  placeholder = '선택',
  onPress,
  displayValue,
}: SelectFieldProps) {
  return (
    <FormField label={label} required={required} error={error}>
      <TouchableOpacity
        style={[styles.select, error ? styles.inputError : null]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <Text style={[styles.selectText, !value && styles.placeholder]}>
          {displayValue || value || placeholder}
        </Text>
        <Text style={styles.selectArrow}>▼</Text>
      </TouchableOpacity>
    </FormField>
  );
}

interface OptionSheetProps<T> {
  visible: boolean;
  title: string;
  options: { label: string; value: T }[];
  selectedValue?: T;
  onSelect: (value: T) => void;
  onClose: () => void;
}

export function OptionSheet<T extends string>({
  visible,
  title,
  options,
  selectedValue,
  onSelect,
  onClose,
}: OptionSheetProps<T>) {
  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <TouchableOpacity style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>{title}</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.sheetClose}>닫기</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.sheetScroll}>
          {options.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.option,
                opt.value === selectedValue && styles.optionSelected,
              ]}
              onPress={() => {
                onSelect(opt.value);
                onClose();
              }}
            >
              <Text
                style={[
                  styles.optionText,
                  opt.value === selectedValue && styles.optionTextSelected,
                ]}
              >
                {opt.label}
              </Text>
              {opt.value === selectedValue && (
                <Text style={styles.optionCheck}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    letterSpacing: 0.3,
  },
  required: {
    color: Colors.accent,
    marginLeft: 3,
    fontSize: 13,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text,
    minHeight: 44,
  },
  inputWithUnit: {
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
  inputError: {
    borderColor: Colors.error,
  },
  unit: {
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderLeftWidth: 0,
    borderColor: Colors.border,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 13,
    color: Colors.textSecondary,
    minHeight: 44,
    textAlignVertical: 'center',
    lineHeight: 20,
  },
  error: {
    fontSize: 12,
    color: Colors.error,
    marginTop: 4,
  },
  hint: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
  },
  select: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
  },
  selectText: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
  },
  placeholder: {
    color: Colors.textMuted,
  },
  selectArrow: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  // Option Sheet
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  sheetClose: {
    fontSize: 14,
    color: Colors.accent,
    fontWeight: '500',
  },
  sheetScroll: {
    maxHeight: 400,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  optionSelected: {
    backgroundColor: Colors.surfaceLight,
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
  },
  optionTextSelected: {
    color: Colors.gold,
    fontWeight: '600',
  },
  optionCheck: {
    color: Colors.gold,
    fontSize: 16,
    fontWeight: '700',
  },
});
