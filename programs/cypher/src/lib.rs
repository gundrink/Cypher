use anchor_lang::prelude::*;

declare_id!("9TBbzTqU4PhnteAmzZE4Y9ZcHhrXjhpdkFoQS8LBKdEq");

pub const MAX_USERNAME_LEN: usize = 32;
pub const MAX_VIEWING_KEY_LEN: usize = 33;
pub const MAX_EPHEMERAL_LEN: usize = 64;
pub const MAX_METADATA_LEN: usize = 128;

#[program]
pub mod cypher {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let registry = &mut ctx.accounts.registry;
        registry.admin = ctx.accounts.admin.key();
        registry.bump = ctx.bumps.registry;
        registry.announcement_count = 0;
        Ok(())
    }

    pub fn register_username(
        ctx: Context<RegisterUsername>,
        username: String,
        viewing_key: Vec<u8>,
    ) -> Result<()> {
        validate_username(&username)?;
        require!(
            viewing_key.len() == 32 || viewing_key.len() == 33,
            CypherError::BadViewingKey
        );

        let record = &mut ctx.accounts.record;
        record.owner = ctx.accounts.owner.key();
        record.username = username.clone();
        record.viewing_key = viewing_key.clone();
        record.bump = ctx.bumps.record;

        let owner_record = &mut ctx.accounts.owner_record;
        owner_record.username = username.clone();
        owner_record.bump = ctx.bumps.owner_record;

        emit!(UsernameRegistered {
            owner: ctx.accounts.owner.key(),
            username,
            viewing_key,
        });
        Ok(())
    }

    pub fn announce(
        ctx: Context<Announce>,
        index: u64,
        stealth_address: [u8; 32],
        ephemeral_public_key: Vec<u8>,
        metadata: Vec<u8>,
    ) -> Result<()> {
        require!(
            index == ctx.accounts.registry.announcement_count,
            CypherError::BadAnnouncementIndex
        );
        require!(
            (32..=MAX_EPHEMERAL_LEN).contains(&ephemeral_public_key.len()),
            CypherError::BadEphemeralKey
        );
        require!(
            metadata.len() <= MAX_METADATA_LEN,
            CypherError::BadMetadata
        );

        let slot = Clock::get()?.slot;
        let announcement = &mut ctx.accounts.announcement;
        announcement.sender = ctx.accounts.sender.key();
        announcement.stealth_address = stealth_address;
        announcement.ephemeral_public_key = ephemeral_public_key.clone();
        announcement.metadata = metadata.clone();
        announcement.slot = slot;
        announcement.index = index;
        announcement.bump = ctx.bumps.announcement;

        ctx.accounts.registry.announcement_count = index
            .checked_add(1)
            .ok_or(CypherError::Math)?;

        emit!(StealthAnnounced {
            sender: ctx.accounts.sender.key(),
            stealth_address,
            ephemeral_public_key,
            metadata,
            index,
            slot,
        });
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = admin,
        space = Registry::SPACE,
        seeds = [b"registry"],
        bump
    )]
    pub registry: Account<'info, Registry>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(username: String)]
pub struct RegisterUsername<'info> {
    #[account(seeds = [b"registry"], bump = registry.bump)]
    pub registry: Account<'info, Registry>,
    #[account(
        init,
        payer = owner,
        space = UsernameRecord::SPACE,
        seeds = [b"username", username.as_bytes()],
        bump
    )]
    pub record: Account<'info, UsernameRecord>,
    #[account(
        init,
        payer = owner,
        space = OwnerRecord::SPACE,
        seeds = [b"owner", owner.key().as_ref()],
        bump
    )]
    pub owner_record: Account<'info, OwnerRecord>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(index: u64)]
pub struct Announce<'info> {
    #[account(mut, seeds = [b"registry"], bump = registry.bump)]
    pub registry: Account<'info, Registry>,
    #[account(
        init,
        payer = sender,
        space = Announcement::SPACE,
        seeds = [b"announce", sender.key().as_ref(), &index.to_le_bytes()],
        bump
    )]
    pub announcement: Account<'info, Announcement>,
    #[account(mut)]
    pub sender: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct Registry {
    pub admin: Pubkey,
    pub bump: u8,
    pub announcement_count: u64,
}

impl Registry {
    pub const SPACE: usize = 8 + 32 + 1 + 8;
}

#[account]
pub struct UsernameRecord {
    pub owner: Pubkey,
    pub username: String,
    pub viewing_key: Vec<u8>,
    pub bump: u8,
}

impl UsernameRecord {
    pub const SPACE: usize = 8 + 32 + 4 + MAX_USERNAME_LEN + 4 + MAX_VIEWING_KEY_LEN + 1;
}

#[account]
pub struct OwnerRecord {
    pub username: String,
    pub bump: u8,
}

impl OwnerRecord {
    pub const SPACE: usize = 8 + 4 + MAX_USERNAME_LEN + 1;
}

#[account]
pub struct Announcement {
    pub sender: Pubkey,
    pub stealth_address: [u8; 32],
    pub ephemeral_public_key: Vec<u8>,
    pub metadata: Vec<u8>,
    pub slot: u64,
    pub index: u64,
    pub bump: u8,
}

impl Announcement {
    pub const SPACE: usize =
        8 + 32 + 32 + 4 + MAX_EPHEMERAL_LEN + 4 + MAX_METADATA_LEN + 8 + 8 + 1;
}

#[event]
pub struct UsernameRegistered {
    pub owner: Pubkey,
    pub username: String,
    pub viewing_key: Vec<u8>,
}

#[event]
pub struct StealthAnnounced {
    pub sender: Pubkey,
    pub stealth_address: [u8; 32],
    pub ephemeral_public_key: Vec<u8>,
    pub metadata: Vec<u8>,
    pub index: u64,
    pub slot: u64,
}

#[error_code]
pub enum CypherError {
    #[msg("Username must be 3-32 characters: letters, numbers, underscore.")]
    BadUsername,
    #[msg("Viewing key must be 32 or 33 bytes.")]
    BadViewingKey,
    #[msg("Ephemeral key length is invalid.")]
    BadEphemeralKey,
    #[msg("Metadata is too long.")]
    BadMetadata,
    #[msg("Announcement index does not match the registry.")]
    BadAnnouncementIndex,
    #[msg("Math overflow.")]
    Math,
}

fn validate_username(username: &str) -> Result<()> {
    let bytes = username.as_bytes();
    require!(
        (3..=MAX_USERNAME_LEN).contains(&bytes.len()),
        CypherError::BadUsername
    );
    require!(
        bytes
            .iter()
            .all(|byte| byte.is_ascii_alphanumeric() || *byte == b'_'),
        CypherError::BadUsername
    );
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn accepts_username() {
        assert!(validate_username("neo").is_ok());
        assert!(validate_username("cypher_1").is_ok());
    }

    #[test]
    fn rejects_username() {
        assert!(validate_username("ab").is_err());
        assert!(validate_username("has space").is_err());
        assert!(validate_username("name-with-dash").is_err());
    }
}
