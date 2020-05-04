import React, { useState, useCallback } from 'react';
import { Field, TextInput, Box, Icon, Margins, Button, ButtonGroup } from '@rocket.chat/fuselage';
import s from 'underscore.string';

import { useToastMessageDispatch } from '../../../../client/contexts/ToastMessagesContext';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useMethod } from '../../../../client/contexts/ServerContext';
import { useFileInput } from '../../../../client/hooks/useFileInput';

export function NewSound({ goToNew, close, onChange, ...props }) {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const [name, setName] = useState('');
	const [sound, setSound] = useState();

	const uploadCustomSound = useMethod('uploadCustomSound');

	const insertOrUpdateSound = useMethod('insertOrUpdateSound');

	const handleChangeFile = (soundFile) => {
		setSound(soundFile);
	};

	const clickUpload = useFileInput(handleChangeFile, 'audio/mp3');

	const validate = (soundData, soundFile) => {
		const errors = [];
		if (!soundData.name) {
			errors.push('Name');
		}


		if (!soundFile) {
			errors.push('Sound_File_mp3');
		}
		errors.forEach((error) => dispatchToastMessage({ type: 'error', message: t('error-the-field-is-required', t(error)) }));

		if (soundFile) {
			if (!/audio\/mp3/.test(soundFile.type) && !/audio\/mpeg/.test(soundFile.type) && !/audio\/x-mpeg/.test(soundFile.type)) {
				errors.push('FileType');
				dispatchToastMessage({ type: 'error', message: t('error-invalid-file-type') });
			}
		}

		return errors.length === 0;
	};

	const createSoundData = (name) => {
		const soundData = {};
		soundData.name = s.trim(name);
		soundData.newFile = true;
		return soundData;
	};

	const saveAction = async (name, soundFile) => {
		const soundData = createSoundData(name);
		if (validate(soundData, soundFile)) {
			let soundId;
			try {
				soundId = await insertOrUpdateSound(soundData);
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}

			soundData._id = soundId;
			soundData.random = Math.round(Math.random() * 1000);

			if (soundId) {
				dispatchToastMessage({ type: 'success', message: t('Uploading_file') });

				const reader = new FileReader();
				reader.readAsBinaryString(soundFile);
				reader.onloadend = () => {
					console.log(reader.result, soundFile.type, soundData);

					try {
						uploadCustomSound(reader.result, soundFile.type, soundData);
						dispatchToastMessage({ type: 'success', message: t('File_uploaded') });
					} catch (error) {
						dispatchToastMessage({ type: 'error', message: error });
					}
				};
			}
			return soundId;
		}
	};

	const handleSave = useCallback(async () => {
		try {
			const result = await saveAction(
				name,
				sound,
			);
			dispatchToastMessage({ type: 'success', message: t('Custom_Sound_Updated_Successfully') });
			goToNew(result)();
			onChange();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	}, [name, sound]);

	return <Box display='flex' flexDirection='column' fontScale='p1' color='default' mbs='x20' {...props}>
		<Margins block='x4'>
			<Field>
				<Field.Label>{t('Name')}</Field.Label>
				<Field.Row>
					<TextInput value={name} onChange={(e) => setName(e.currentTarget.value)} placeholder={t('Name')} />
				</Field.Row>
			</Field>
			<Field>
				<Field.Label alignSelf='stretch'>{t('Sound_File_mp3')}</Field.Label>
				<Box display='flex' flexDirection='row' mbs='none'>
					<Margins inline='x4'>
						<Button square onClick={clickUpload}><Icon name='upload' size='x20'/></Button>
						{(sound && sound.name) || 'none'}
					</Margins>
				</Box>
			</Field>
			<Field>
				<Field.Row>
					<ButtonGroup stretch w='full'>
						<Button mie='x4' onClick={close}>{t('Cancel')}</Button>
						<Button primary onClick={handleSave} disabled={name === ''}>{t('Save')}</Button>
					</ButtonGroup>
				</Field.Row>
			</Field>
		</Margins>
	</Box>;
}
