import { Form, FormField } from '../components/Form/Form';
import { ContactInfo } from './ContactInfo';

export const ContactForm = ({ onSubmit }: { onSubmit: (data: ContactInfo) => void }) => {
    return (
        <Form
            formFields={contactFormFields}
            submitLabel="Continuer"
            onSubmit={onSubmit}
        />
    );
};

const contactFormFields: FormField[] = [
    { type: 'text', placeholder: 'Nom complet', name: 'name', required: true },
    { type: 'text', placeholder: 'E-mail', name: 'email', required: true },
    {
        type: 'text',
        placeholder: 'Numéro de téléphone',
        name: 'phone',
        required: true,
    },
    {
        type: 'text',
        placeholder: "Message à l'attention du commerçant",
        name: 'comments',
        required: false,
    },
];
