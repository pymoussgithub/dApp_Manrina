import { Control, useController } from 'react-hook-form';
import { StyleSheet, Text, TextInput } from 'react-native';

export type TextFormField = {
    type: 'text';
    placeholder: string;
    name: string;
    required?: boolean;
};
export const Input = ({
    placeholder,
    name,
    control,
    required,
}: Omit<TextFormField, 'type'> & {
    control: Control;
}) => {
    const { field, fieldState } = useController({
        control,
        defaultValue: '',
        name,
        rules: {
            required: required ? 'Ce champ est requis' : false,
        },
    });
    const hasError = !!fieldState.error;

    return (
        <>
            {fieldState.error && <Text style={styles.inputErrorText}>{fieldState.error.message}</Text>}
            <TextInput
                placeholder={placeholder}
                style={[styles.input, hasError && styles.inputError]}
                value={field.value}
                onChangeText={field.onChange}
            />
        </>
    );
};

export const styles = StyleSheet.create({
    input: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 10,
        marginBottom: 15,
        fontSize: 16,
        width: '100%',
    },
    inputError: {
        borderColor: 'red',
    },
    inputErrorText: {
        color: 'red',
    },
});
