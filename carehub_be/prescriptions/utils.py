from billing.models import PathologyDetail

SESSIONS_RULES = {
    'PC': [(1, "1ère"), (9, '2 à 9'), (18, '10 à 18'), (float('inf'), '19 à …')],
    'FA': [(1, "1ère"), (20, '2 à 20'), (60, '21 à 60'), (float('inf'), '61 à …')],
    'FB': [(1, "1ère"), (60, '2 à 60'), (80, '61 à 80'), (float('inf'), '81 à …')],
    'Lymph': [(1, "1ère"), (60, '2 à 60')],
    'E': [(1, "1ère"), (float('inf'), '2 à …')],
    'Pallia': [(float('inf'), '')],
}

def get_session_number(category_code, nb_sessions):
    """
    Détermine le code de la session par rapport à la pathologie et le nb de sessions effectuées.
    """
    rules = SESSIONS_RULES.get(category_code)
    if not rules:
        return None
    
    for max_sessions, session_number in rules:
        if nb_sessions < max_sessions:
            return session_number
    
    return rules[-1][1]